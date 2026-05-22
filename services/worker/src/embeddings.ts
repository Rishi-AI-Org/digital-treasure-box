interface EmbeddingEnv {
  OPENAI_API_KEY?: string;
  EMBEDDING_MODEL?: string;
}

export async function createEmbedding(text: string, env: EmbeddingEnv): Promise<number[] | null> {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: env.EMBEDDING_MODEL || "text-embedding-3-small",
      input: text.slice(0, 8000)
    })
  });

  if (!response.ok) {
    throw new Error(`Embedding request failed with ${response.status}`);
  }

  const data = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
  return data.data?.[0]?.embedding ?? null;
}
