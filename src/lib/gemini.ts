import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

// export async function getEmbedding(text: string) {
//   const result = await model.embedContent(text);

//   return result.embedding.values;
// }

const google = createGoogleGenerativeAI();

export async function getEmbedding(text: string) {
  // const { doEmbed } = google.textEmbeddingModel("text-embedding-004");
  // const embeddings = (await doEmbed({ values: [text] })).embeddings;

  // return embeddings[0];
  const embeddings = embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: text,
  });

  return (await embeddings).embedding;
}

export { google };
