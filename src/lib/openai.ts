import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) throw new Error("OPENAI_API_KEY is not defined");

export const openai = new OpenAI({ apiKey });

export async function getEmbedding(text: string) {
  const res = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  const embedding = res.data[0].embedding;
  console.log(embedding);
  if (!embedding) throw new Error("Error generating embedding");

  return embedding;
}
