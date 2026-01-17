import { notesIndex } from "@/lib/db/pinecone";
import prisma from "@/lib/db/prisma";
import { CoreMessage } from "@/lib/types";
import { auth } from "@clerk/nextjs";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

import { NextRequest, NextResponse } from "next/server";

async function getEmbedding(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: [text],
  });
  return response.embeddings?.[0]?.values ?? [];
}

export async function POST(req: NextRequest) {
  const { history: historyFull } = (await req.json()) as {
    history: CoreMessage[];
  };

  try {
    const history = historyFull.slice(-6);

    const embedding = await getEmbedding(
      history.map((message) => message.content).join("\n"),
    );

    const { userId } = auth();

    const vectorQueryResponse = await notesIndex.query({
      vector: embedding,
      topK: 4,
      filter: { userId },
    });

    const relevantNotes = await prisma.note.findMany({
      where: {
        id: {
          in: vectorQueryResponse.matches.map((match) => match.id),
        },
      },
    });

    const systemMessage: CoreMessage = {
      role: "model",
      content:
        "You are an intelligent note-taking app. You answer the user's question based on their existing notes. " +
        "The relevant notes for this query are:\n" +
        relevantNotes
          .map((note) => `Title: ${note.title}\n\nContent:\n${note.content}`)
          .join("\n\n") +
        "\n\nAlways take a look at this before giving a response." +
        "\n\nDo not mention like 'Based on the provided notes, I think...'. Just give the answer.",
    };

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: [
        {
          role: "model",
          content: systemMessage.content,
        },
        ...history,
      ].map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    const firstMessage = history[history.length - 1]?.content ?? "Hello";

    // Start streaming response
    const stream = await chat.sendMessageStream({ message: firstMessage });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text ?? "";
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error,
      },
      { status: 500 },
    );
  }
}
