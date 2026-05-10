import { NextRequest } from "next/server";
import { complete } from "@/lib/llm";
import {
  SYSTEM_PROMPT,
  prompt01Clarification,
  prompt02Competitors,
  prompt03Audit,
  prompt04RedFlags,
  prompt05Roadmap,
} from "@/lib/prompts";
import { searchAll, hasSerperKey } from "@/lib/serper";

export const runtime = "nodejs";
export const maxDuration = 300;

type Step01 = {
  summary: string;
  extracted: {
    stage?: string;
    problem?: string | null;
    target?: string | null;
    business_model?: string | null;
  };
  status: "ready_for_analysis" | "needs_clarification";
  clarification_questions?: string[];
  search_queries: string[];
};

function hasCriticalVars(extracted: Step01["extracted"]): boolean {
  const ok = (v?: string | null) =>
    typeof v === "string" && v.trim().length > 5 && v.trim().toLowerCase() !== "null";
  return ok(extracted.problem) && ok(extracted.target) && ok(extracted.business_model);
}

type Step03 = {
  verdict: string;
  global_score: number;
  scores: Record<string, { score: number }>;
};

type Step04 = {
  red_flags: Array<{ id: string; criticality: string; axis: string }>;
  kill_questions: string[];
};

export async function POST(req: NextRequest) {
  const { idea } = (await req.json()) as { idea?: string };

  if (!idea || idea.trim().length < 50) {
    return new Response(
      JSON.stringify({ error: "Trop vague. Balance plus de 50 caractères." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        send("step", { index: 0, label: "Compréhension & clarification" });
        const step01 = await complete<Step01>({
          system: SYSTEM_PROMPT,
          prompt: prompt01Clarification(idea),
        });

        // Override : if the 3 critical vars are present, force ready_for_analysis.
        // Small models like gemma3:4b often over-flag missing_critical.
        if (hasCriticalVars(step01.extracted)) {
          step01.status = "ready_for_analysis";
        }

        send("result", { step: "clarification", data: step01 });

        if (step01.status === "needs_clarification") {
          send("done", { reason: "needs_clarification" });
          controller.close();
          return;
        }

        send("step", {
          index: 1,
          label: hasSerperKey()
            ? "Recherche concurrents (Serper)"
            : "Recherche concurrents (skipped — no SERPER_API_KEY)",
        });
        const serperResults = await searchAll(step01.search_queries);
        const step02 = await complete({
          system: SYSTEM_PROMPT,
          prompt: prompt02Competitors(
            step01.summary,
            JSON.stringify(serperResults, null, 2)
          ),
        });
        send("result", { step: "competitors", data: step02 });

        send("step", { index: 2, label: "Audit 8 axes" });
        const step03 = await complete<Step03>({
          system: SYSTEM_PROMPT,
          prompt: prompt03Audit(step01.summary, step01.extracted, step02),
        });
        send("result", { step: "audit", data: step03 });

        send("step", { index: 3, label: "Red flags hiérarchisés" });
        const step04 = await complete<Step04>({
          system: SYSTEM_PROMPT,
          prompt: prompt04RedFlags(step01.summary, step03, step02),
        });
        send("result", { step: "red_flags", data: step04 });

        send("step", { index: 4, label: "Roadmap 3 semaines" });
        const topRedFlags = step04.red_flags.slice(0, 3);
        const step05 = await complete({
          system: SYSTEM_PROMPT,
          prompt: prompt05Roadmap(
            step01.summary,
            step03.verdict,
            topRedFlags,
            step01.extracted.stage ?? "idée"
          ),
        });
        send("result", { step: "roadmap", data: step05 });

        send("done", { reason: "ok" });
        controller.close();
      } catch (e) {
        const message = e instanceof Error ? e.message : "unknown error";
        send("error", { message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
