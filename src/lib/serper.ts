const SERPER_KEY = process.env.SERPER_API_KEY;

export type SerperResult = {
  query: string;
  organic?: Array<{ title?: string; link?: string; snippet?: string }>;
  error?: string;
};

export async function searchAll(queries: string[]): Promise<SerperResult[]> {
  if (!SERPER_KEY) {
    return queries.map((q) => ({ query: q, error: "SERPER_API_KEY missing" }));
  }
  return Promise.all(queries.map(searchOne));
}

async function searchOne(query: string): Promise<SerperResult> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 10 }),
    });
    if (!res.ok) return { query, error: `HTTP ${res.status}` };
    const data = (await res.json()) as { organic?: SerperResult["organic"] };
    return { query, organic: data.organic ?? [] };
  } catch (e) {
    return { query, error: e instanceof Error ? e.message : "unknown" };
  }
}

export function hasSerperKey(): boolean {
  return Boolean(SERPER_KEY);
}
