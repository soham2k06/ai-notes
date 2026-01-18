import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: [text],
  });
  return response.embeddings?.[0]?.values ?? [];
}
