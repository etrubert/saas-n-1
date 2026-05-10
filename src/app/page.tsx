"use client";

import { useState } from "react";

type Stage = "idle" | "running" | "done" | "error";

const AXIS_LABELS: Record<string, string> = {
  problem_severity: "Gravité du problème",
  market_size: "Taille du marché",
  willingness_to_pay: "Volonté de payer",
  competitive_moat: "Moat concurrentiel",
  execution_feasibility: "Faisabilité d'exécution",
  founder_market_fit: "Founder–market fit",
  market_timing: "Timing marché",
  scalability: "Scalabilité",
};

const AXIS_ORDER = [
  "problem_severity",
  "founder_market_fit",
  "market_size",
  "market_timing",
  "willingness_to_pay",
  "competitive_moat",
  "execution_feasibility",
  "scalability",
];

type ScoreEntry = { score: number; justification?: string; evidence?: string };
type AuditData = {
  scores: Record<string, ScoreEntry>;
  global_score: number;
  verdict: "GO" | "PIVOT" | "NO-GO" | string;
  verdict_subtitle?: string;
  verdict_description?: string;
  painkiller_or_vitamin?: "PAINKILLER" | "VITAMIN" | string;
  one_line_verdict?: string;
};
type Actor = {
  name: string;
  type: "DIRECT" | "INDIRECT" | "STATU QUO" | string;
  threat_score: number;
  note: string;
  url?: string | null;
};
type CompetitorsData = {
  actors: Actor[];
  substitutes?: string[];
  market_size?: { tam_estimate?: string | null; note?: string };
  competitive_density?: string;
};
type RedFlag = {
  id: string;
  title: string;
  description: string;
  criticality: "CRITICAL" | "HIGH" | "MEDIUM" | string;
  axis: string;
  recommendation: string;
};
type RedFlagsData = {
  red_flags: RedFlag[];
  kill_questions: string[];
};
type RoadmapWeek = {
  week: number;
  title: string;
  deliverable: string;
  validation: string;
};
type RoadmapData = {
  roadmap: RoadmapWeek[];
  final_warning?: string;
};
type Clarification = {
  summary: string;
  status: "ready_for_analysis" | "needs_clarification";
  clarification_questions?: string[];
  extracted?: { stage?: string };
};

type Results = {
  clarification?: Clarification;
  competitors?: CompetitorsData;
  audit?: AuditData;
  red_flags?: RedFlagsData;
  roadmap?: RoadmapData;
};

const PIPELINE_LABELS = [
  "Compréhension & clarification",
  "Recherche concurrents",
  "Audit 8 axes",
  "Red flags & kill questions",
  "Roadmap 3 semaines",
];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [currentStep, setCurrentStep] = useState(-1);
  const [results, setResults] = useState<Results>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function analyze() {
    if (idea.trim().length < 50) {
      alert("Trop vague. Balance plus de 50 caractères.");
      return;
    }
    setStage("running");
    setCurrentStep(-1);
    setResults({});
    setErrorMsg(null);

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
    });

    if (!res.ok || !res.body) {
      const txt = await res.text();
      setErrorMsg(txt || `HTTP ${res.status}`);
      setStage("error");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const evt of events) {
        const lines = evt.split("\n");
        const eventLine = lines.find((l) => l.startsWith("event: "));
        const dataLine = lines.find((l) => l.startsWith("data: "));
        if (!eventLine || !dataLine) continue;
        const eventType = eventLine.slice(7).trim();
        const data = JSON.parse(dataLine.slice(6));

        if (eventType === "step") {
          setCurrentStep((data as { index: number }).index);
        } else if (eventType === "result") {
          const r = data as { step: keyof Results; data: unknown };
          setResults((prev) => ({ ...prev, [r.step]: r.data as never }));
        } else if (eventType === "error") {
          setErrorMsg((data as { message: string }).message);
          setStage("error");
          return;
        } else if (eventType === "done") {
          setCurrentStep(PIPELINE_LABELS.length);
          setStage("done");
        }
      }
    }
  }

  const hasReport =
    stage === "done" && results.audit && results.red_flags && results.roadmap;

  return (
    <div style={{ minHeight: "100vh" }}>
      {!hasReport && (
        <InputSection
          idea={idea}
          setIdea={setIdea}
          stage={stage}
          currentStep={currentStep}
          errorMsg={errorMsg}
          onAnalyze={analyze}
          clarification={results.clarification}
        />
      )}

      {hasReport &&
        results.audit &&
        results.competitors &&
        results.red_flags &&
        results.roadmap && (
          <Report
            audit={results.audit}
            competitors={results.competitors}
            redFlags={results.red_flags}
            roadmap={results.roadmap}
            onReset={() => {
              setStage("idle");
              setResults({});
              setIdea("");
            }}
          />
        )}
    </div>
  );
}

/* ============================================================== TOPNAV */

function TopNav() {
  return (
    <nav
      style={{
        background: "var(--cream)",
        borderBottom: "1px solid var(--rule)",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "16px 24px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <span className="eyebrow eyebrow-soft" style={{ fontSize: 11 }}>
        Submit · Audit · Verdict
      </span>
      <span
        className="serif"
        style={{
          fontSize: 22,
          fontStyle: "italic",
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        VC Killer
      </span>
      <span
        className="eyebrow eyebrow-soft"
        style={{ fontSize: 11, justifySelf: "end" }}
      >
        GO · PIVOT · NO-GO
      </span>
    </nav>
  );
}

/* ============================================================== INPUT */

function InputSection({
  idea,
  setIdea,
  stage,
  currentStep,
  errorMsg,
  onAnalyze,
  clarification,
}: {
  idea: string;
  setIdea: (s: string) => void;
  stage: Stage;
  currentStep: number;
  errorMsg: string | null;
  onAnalyze: () => void;
  clarification?: Clarification;
}) {
  return (
    <>
      <TopNav />

      <section
        style={{
          background: "var(--bg-deep)",
          color: "var(--on-deep)",
          padding: "56px 56px 0",
          position: "relative",
          overflow: "hidden",
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            alignItems: "start",
          }}
        >
          <div style={{ paddingTop: 80, maxWidth: 460 }}>
            <p
              className="serif"
              style={{
                fontSize: 24,
                lineHeight: 1.35,
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              Where the boldest ideas{" "}
              <em style={{ fontWeight: 700 }}>get audited.</em>
              <br />
              Honest. Sharp. Factual.
            </p>
          </div>
          <div
            style={{ paddingTop: 16, justifySelf: "end", minWidth: 320 }}
          >
            <HeroLink label="Painkiller diagnostics" />
            <HeroLink label="8-axis breakdown" />
            <HeroLink label="Founder kill questions" />
          </div>
        </div>

        <h1
          className="serif"
          style={{
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "clamp(140px, 26vw, 360px)",
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
            marginTop: 24,
            marginBottom: -40,
            color: "var(--on-deep)",
          }}
        >
          VC Killer
        </h1>
      </section>

      <div style={{ background: "var(--bg-deep)", padding: "0 56px" }}>
        <div
          style={{
            borderTop: "1px solid var(--on-deep)",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            borderTop: "1px solid var(--on-deep)",
            opacity: 0.3,
            marginTop: 4,
          }}
        />
      </div>

      <main
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "72px 24px 80px",
        }}
      >
        <p
          className="eyebrow eyebrow-soft"
          style={{ marginBottom: 16 }}
        >
          Submit your idea
        </p>
        <h2
          className="serif"
          style={{
            fontSize: "clamp(34px, 5vw, 48px)",
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 1.1,
            marginBottom: 32,
            maxWidth: 640,
          }}
        >
          Décris ton idée. Plus c&apos;est précis, plus l&apos;audit est mordant.
        </h2>

        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Problème résolu, cible précise, modèle de monétisation, concurrents identifiés…"
          rows={9}
          disabled={stage === "running"}
          style={{
            width: "100%",
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--ink)",
            padding: 22,
            fontSize: 15,
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            lineHeight: 1.55,
          }}
        />

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}
        >
          <button
            onClick={onAnalyze}
            disabled={stage === "running"}
            style={{
              background: stage === "running" ? "var(--muted)" : "var(--ink)",
              color: "var(--cream)",
              border: "none",
              padding: "18px 36px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: stage === "running" ? "not-allowed" : "pointer",
            }}
          >
            {stage === "running" ? "Analyse en cours…" : "Démonter mon idée"}
          </button>
          <span
            style={{ color: "var(--muted)", fontSize: 12, letterSpacing: "0.06em" }}
          >
            {idea.length} car. — min 50
          </span>
        </div>

        {stage !== "idle" && (
          <section style={{ marginTop: 64 }}>
            <p className="eyebrow" style={{ marginBottom: 20 }}>
              Pipeline
            </p>
            <ol style={{ listStyle: "none" }}>
              {PIPELINE_LABELS.map((step, i) => {
                const done = i < currentStep || stage === "done";
                const active = i === currentStep && stage === "running";
                return (
                  <li
                    key={i}
                    style={{
                      padding: "16px 0",
                      borderBottom: "1px solid var(--rule)",
                      fontSize: 14,
                      color: done
                        ? "var(--ink)"
                        : active
                        ? "var(--ink)"
                        : "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span style={{ width: 28, fontWeight: 600 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ flex: 1 }}>{step}</span>
                    <span>{done ? "✓" : active ? "●" : "↗"}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {clarification?.status === "needs_clarification" && stage === "done" && (
          <section
            style={{
              marginTop: 48,
              padding: 32,
              background: "var(--paper)",
              border: "1px solid var(--ink)",
            }}
          >
            <p className="eyebrow" style={{ marginBottom: 12 }}>
              Manque d&apos;info — clarifie d&apos;abord
            </p>
            <p
              className="serif"
              style={{
                fontSize: 22,
                fontStyle: "italic",
                lineHeight: 1.3,
                marginBottom: 20,
              }}
            >
              Ton input est trop vague. Réponds aux questions ci-dessous puis
              relance.
            </p>
            <ol style={{ paddingLeft: 20 }}>
              {clarification.clarification_questions?.map((q, i) => (
                <li
                  key={i}
                  style={{ marginBottom: 10, fontSize: 14, lineHeight: 1.55 }}
                >
                  {q}
                </li>
              ))}
            </ol>
          </section>
        )}

        {stage === "error" && (
          <section
            style={{
              marginTop: 24,
              padding: 16,
              border: "1px solid var(--critical)",
              background: "rgba(122,42,42,0.08)",
              color: "var(--ink)",
              fontSize: 14,
            }}
          >
            <strong>Erreur :</strong> {errorMsg}
          </section>
        )}
      </main>
    </>
  );
}

function HeroLink({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid rgba(239,233,220,0.4)",
        minWidth: 320,
        gap: 24,
      }}
    >
      <span
        className="eyebrow"
        style={{
          color: "var(--on-deep)",
          fontSize: 11,
          letterSpacing: "0.16em",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 18, lineHeight: 1 }}>↗</span>
    </div>
  );
}

/* ============================================================== REPORT */

function Report({
  audit,
  competitors,
  redFlags,
  roadmap,
  onReset,
}: {
  audit: AuditData;
  competitors: CompetitorsData;
  redFlags: RedFlagsData;
  roadmap: RoadmapData;
  onReset: () => void;
}) {
  return (
    <>
      <TopNav />
      <main
        style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 64px" }}
      >
        <ReportHeader onReset={onReset} />
        <HeroVerdict audit={audit} />
        <ScoreCard audit={audit} />
        <NotationBars audit={audit} />
        <Grid>
          <RedFlagsList redFlags={redFlags} />
          <KillQuestions questions={redFlags.kill_questions} />
        </Grid>
        <CompetitorTable competitors={competitors} />
        <RoadmapBlock roadmap={roadmap} />
        <Footer />
      </main>
    </>
  );
}

function ReportHeader({ onReset }: { onReset: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 24,
        marginBottom: 16,
      }}
    >
      <p className="eyebrow">VC Killer — Rapport d&apos;audit</p>
      <button
        onClick={onReset}
        style={{
          background: "transparent",
          border: "1px solid var(--ink)",
          color: "var(--ink)",
          padding: "8px 16px",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Nouvelle analyse
      </button>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}

/* ----- HERO VERDICT ----- */

function HeroVerdict({ audit }: { audit: AuditData }) {
  const verdict = (audit.verdict || "PIVOT").toUpperCase();
  const isNoGo = verdict.includes("NO-GO") || verdict.includes("NOGO");
  const bg = isNoGo ? "var(--critical)" : "var(--bg-deep)";
  const fg = "var(--cream)";

  return (
    <section
      style={{
        background: bg,
        color: fg,
        padding: "64px 56px 80px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <p
        className="eyebrow"
        style={{ color: fg, opacity: 0.7, marginBottom: 32 }}
      >
        Verdict brut
      </p>
      <h2
        className="serif"
        style={{
          fontSize: "clamp(96px, 16vw, 220px)",
          fontStyle: "italic",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 0.85,
          marginBottom: 28,
        }}
      >
        {verdict}
      </h2>
      {audit.verdict_subtitle && (
        <p
          className="serif"
          style={{
            fontSize: "clamp(24px, 3.4vw, 38px)",
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 1.2,
            marginBottom: 24,
            maxWidth: "75%",
          }}
        >
          {audit.verdict_subtitle}
        </p>
      )}
      {audit.verdict_description && (
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.65,
            opacity: 0.92,
            maxWidth: 720,
          }}
        >
          {audit.verdict_description}
        </p>
      )}
    </section>
  );
}

/* ----- SCORE CARD ----- */

function ScoreCard({ audit }: { audit: AuditData }) {
  const score = Math.max(0, Math.min(100, audit.global_score || 0));
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const tag = (audit.painkiller_or_vitamin || "VITAMIN").toUpperCase();
  const isPainkiller = tag.includes("PAIN");

  return (
    <div
      style={{
        background: "var(--paper)",
        padding: 32,
        border: "1px solid var(--rule)",
        display: "flex",
        flexDirection: "column",
        maxWidth: 420,
        margin: "0 auto 24px",
        width: "100%",
      }}
    >
      <p className="eyebrow" style={{ marginBottom: 24 }}>
        Score global
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px 0",
        }}
      >
        <svg width={210} height={210} viewBox="0 0 210 210">
          <circle
            cx={105}
            cy={105}
            r={radius}
            stroke="#e5e0d3"
            strokeWidth={14}
            fill="none"
          />
          <circle
            cx={105}
            cy={105}
            r={radius}
            stroke="var(--bg-deep)"
            strokeWidth={14}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 105 105)"
          />
          <text
            x={105}
            y={113}
            textAnchor="middle"
            className="serif"
            style={{ fontSize: 56, fontWeight: 700, fill: "var(--ink)" }}
          >
            {score}
          </text>
          <text
            x={105}
            y={138}
            textAnchor="middle"
            style={{ fontSize: 11, fill: "var(--muted)", letterSpacing: 1 }}
          >
            / 100
          </text>
        </svg>
      </div>
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="eyebrow" style={{ fontSize: 10 }}>
          Painkiller / Vitamin
        </span>
        <span
          style={{
            background: isPainkiller ? "var(--critical)" : "var(--ink)",
            color: "var(--cream)",
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.15em",
          }}
        >
          {tag}
        </span>
      </div>
    </div>
  );
}

/* ----- NOTATION BARS ----- */

function NotationBars({ audit }: { audit: AuditData }) {
  return (
    <section
      style={{
        background: "var(--paper)",
        padding: 40,
        border: "1px solid var(--ink)",
        marginBottom: 24,
      }}
    >
      <p className="eyebrow" style={{ marginBottom: 28 }}>
        Notation détaillée
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {AXIS_ORDER.map((key) => {
          const s = audit.scores?.[key]?.score ?? 0;
          const isLow = s < 40;
          return (
            <div
              key={key}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 1fr 50px",
                gap: 16,
                alignItems: "center",
              }}
            >
              <span className="eyebrow" style={{ fontSize: 11 }}>
                {AXIS_LABELS[key]}
              </span>
              <div
                style={{
                  position: "relative",
                  height: 16,
                  background: "transparent",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    border: "1px solid var(--ink)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: `${s}%`,
                    background: isLow ? "var(--critical)" : "var(--ink)",
                  }}
                />
                {[25, 50, 75].map((p) => (
                  <div
                    key={p}
                    style={{
                      position: "absolute",
                      top: 2,
                      bottom: 2,
                      left: `${p}%`,
                      width: 1,
                      background: "rgba(252,249,241,0.35)",
                    }}
                  />
                ))}
              </div>
              <span
                className="serif"
                style={{ fontSize: 22, fontWeight: 700, textAlign: "right" }}
              >
                {s}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ----- RED FLAGS ----- */

function RedFlagsList({ redFlags }: { redFlags: RedFlagsData }) {
  return (
    <div
      style={{
        background: "var(--paper)",
        padding: 32,
        border: "1px solid var(--rule)",
      }}
    >
      <p className="eyebrow" style={{ marginBottom: 24 }}>
        Red flags
      </p>
      <ul style={{ listStyle: "none" }}>
        {redFlags.red_flags.map((rf, i) => (
          <li
            key={rf.id}
            style={{
              paddingTop: i === 0 ? 0 : 18,
              paddingBottom: 18,
              borderBottom:
                i === redFlags.red_flags.length - 1
                  ? "none"
                  : "1px solid rgba(31,58,45,0.1)",
            }}
          >
            <CriticalityBadge level={rf.criticality} />
            <h3
              className="serif"
              style={{
                fontSize: 19,
                fontWeight: 700,
                marginTop: 8,
                marginBottom: 6,
                lineHeight: 1.25,
              }}
            >
              {rf.title}
            </h3>
            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.55,
                color: "var(--ink-soft)",
              }}
            >
              {rf.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CriticalityBadge({ level }: { level: string }) {
  const lvl = (level || "").toUpperCase();
  const isCrit = lvl === "CRITICAL" || lvl === "CRITIQUE";
  const isHigh = lvl === "HIGH" || lvl === "ÉLEVÉE";
  const bg = isCrit ? "var(--critical)" : isHigh ? "var(--ink)" : "var(--muted)";
  const label = isCrit ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM";
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color: "var(--cream)",
        padding: "4px 10px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.15em",
      }}
    >
      {label}
    </span>
  );
}

/* ----- KILL QUESTIONS ----- */

function KillQuestions({ questions }: { questions: string[] }) {
  return (
    <div
      style={{
        background: "var(--bg-deep)",
        color: "var(--cream)",
        padding: 36,
      }}
    >
      <p
        className="eyebrow"
        style={{ color: "var(--cream)", opacity: 0.7, marginBottom: 20 }}
      >
        Kill questions
      </p>
      <h3
        className="serif"
        style={{
          fontSize: 28,
          fontStyle: "italic",
          fontWeight: 400,
          lineHeight: 1.25,
          marginBottom: 28,
        }}
      >
        Réponds à ces 3 questions{" "}
        <em style={{ fontWeight: 700 }}>avant</em> d&apos;écrire la moindre ligne
        de code.
      </h3>
      <ol style={{ listStyle: "none" }}>
        {questions.slice(0, 3).map((q, i) => (
          <li
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr",
              gap: 16,
              paddingTop: i === 0 ? 0 : 16,
              paddingBottom: 16,
              borderBottom:
                i === questions.length - 1
                  ? "none"
                  : "1px solid rgba(239,233,220,0.15)",
            }}
          >
            <span
              className="serif"
              style={{
                fontSize: 36,
                fontStyle: "italic",
                color: "var(--cream)",
                fontWeight: 700,
                opacity: 0.85,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.5, paddingTop: 8 }}>
              {q}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ----- COMPETITORS ----- */

function CompetitorTable({ competitors }: { competitors: CompetitorsData }) {
  const actors = [...(competitors.actors || [])]
    .sort((a, b) => b.threat_score - a.threat_score)
    .slice(0, 2);
  return (
    <section
      style={{
        background: "var(--paper)",
        padding: 40,
        border: "1px solid var(--ink)",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <p className="eyebrow">Benchmark concurrentiel</p>
        <p
          className="serif"
          style={{ fontSize: 16, fontStyle: "italic", color: "var(--ink)" }}
        >
          Le statu quo est un concurrent.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 0.8fr 1fr 60px 2.5fr",
          gap: 12,
          paddingBottom: 12,
          borderBottom: "1px solid var(--ink)",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: "var(--muted)",
        }}
      >
        <span>Acteur</span>
        <span>Type</span>
        <span>Menace</span>
        <span style={{ textAlign: "right" }}></span>
        <span>Note</span>
      </div>
      {actors.map((a, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 0.8fr 1fr 60px 2.5fr",
            gap: 12,
            padding: "16px 0",
            borderBottom:
              i === actors.length - 1 ? "none" : "1px solid rgba(31,58,45,0.1)",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
          <span>
            <span
              style={{
                display: "inline-block",
                border: "1px solid var(--ink)",
                padding: "3px 8px",
                fontSize: 9,
                letterSpacing: "0.15em",
                fontWeight: 600,
              }}
            >
              {(a.type || "").toUpperCase()}
            </span>
          </span>
          <div style={{ position: "relative", height: 10 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: "1px solid var(--ink)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: `${a.threat_score}%`,
                background:
                  a.threat_score >= 70 ? "var(--critical)" : "var(--ink)",
              }}
            />
          </div>
          <span
            className="serif"
            style={{ fontSize: 16, fontWeight: 700, textAlign: "right" }}
          >
            {a.threat_score}
          </span>
          <span
            style={{
              fontSize: 12.5,
              lineHeight: 1.5,
              color: "var(--ink-soft)",
            }}
          >
            {a.note}
          </span>
        </div>
      ))}
    </section>
  );
}

/* ----- ROADMAP ----- */

function RoadmapBlock({ roadmap }: { roadmap: RoadmapData }) {
  return (
    <section
      style={{
        background: "var(--paper)",
        padding: 48,
        border: "1px solid var(--ink)",
        marginBottom: 24,
      }}
    >
      <p className="eyebrow" style={{ marginBottom: 36 }}>
        Roadmap MVP — 6 semaines
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 32,
          rowGap: 40,
        }}
      >
        {roadmap.roadmap.slice(0, 6).map((w) => (
          <div
            key={w.week}
            style={{ borderLeft: "1px solid var(--ink)", paddingLeft: 20 }}
          >
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                background: "var(--ink)",
                marginLeft: -27,
                marginBottom: 12,
              }}
            />
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--ink)",
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Semaine {w.week}
            </p>
            <h4
              className="serif"
              style={{
                fontSize: 21,
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              {w.title}
            </h4>
            <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
              <strong>Livrable —</strong> {w.deliverable}
            </p>
            <p
              className="serif"
              style={{
                fontSize: 14,
                fontStyle: "italic",
                lineHeight: 1.5,
                color: "var(--ink)",
              }}
            >
              <strong style={{ fontStyle: "normal" }}>Validation —</strong>{" "}
              {w.validation}
            </p>
          </div>
        ))}
      </div>
      {roadmap.final_warning && (
        <p
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid var(--ink)",
            fontSize: 13,
            fontStyle: "italic",
            color: "var(--ink-soft)",
          }}
        >
          ⚠ {roadmap.final_warning}
        </p>
      )}
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: "1px solid var(--ink)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--muted)",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <span>© VC Killer</span>
      <span
        className="serif"
        style={{
          fontStyle: "italic",
          fontSize: 16,
          textTransform: "none",
          letterSpacing: 0,
          color: "var(--ink)",
        }}
      >
        Build something they&apos;ll pay for.
      </span>
    </footer>
  );
}
