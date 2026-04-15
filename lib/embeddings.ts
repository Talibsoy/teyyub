/**
 * Voyage AI Embeddings
 * Anthropic-tövsiyəli embedding provider
 * Model: voyage-3-lite (1024 dim, sürətli, ucuz)
 * Docs: https://docs.voyageai.com/reference/embeddings-api
 */

const VOYAGE_API  = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3-lite";

function getKey(): string {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY env var lazımdır");
  return key;
}

// Tək mətn üçün embedding
export async function embed(text: string): Promise<number[]> {
  const res = await fetch(VOYAGE_API, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${getKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text.slice(0, 8000)], // max token limit
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API xətası: ${res.status} — ${err.slice(0, 200)}`);
  }

  const data = await res.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

// Batch embedding (daha az API call)
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  // Voyage: max 128 input per request
  const BATCH_SIZE = 128;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE).map(t => t.slice(0, 8000));

    const res = await fetch(VOYAGE_API, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${getKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: VOYAGE_MODEL, input: batch }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Voyage batch API xətası: ${res.status} — ${err.slice(0, 200)}`);
    }

    const data = await res.json() as { data: Array<{ embedding: number[] }> };
    results.push(...data.data.map(d => d.embedding));
  }

  return results;
}
