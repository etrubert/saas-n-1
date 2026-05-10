const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma3:4b";

export type LlmOptions = {
  system: string;
  prompt: string;
  temperature?: number;
};

export async function complete<T = unknown>({
  system,
  prompt,
  temperature = 0.3,
}: LlmOptions): Promise<T> {
  const body = {
    model: OLLAMA_MODEL,
    system,
    prompt,
    stream: false,
    format: "json",
    options: {
      temperature,
      top_p: 0.9,
      num_ctx: 8192,
      num_predict: 2048,
    },
  };

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama HTTP ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { response?: string };
  if (!data.response) {
    throw new Error("Ollama returned empty response");
  }

  try {
    return JSON.parse(data.response) as T;
  } catch {
    const retry = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, options: { ...body.options, temperature: 0.1 } }),
    });
    if (!retry.ok) throw new Error("Ollama retry failed");
    const retryData = (await retry.json()) as { response?: string };
    if (!retryData.response) throw new Error("Ollama retry empty");
    return JSON.parse(retryData.response) as T;
  }
}

export function getModelInfo() {
  return { host: OLLAMA_HOST, model: OLLAMA_MODEL };
}
