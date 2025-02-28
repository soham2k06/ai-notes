import { notesIndex } from "@/lib/db/pinecone";
import prisma from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs";
import { getEmbedding } from "@/lib/gemini";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: CoreMessage[] };

  try {
    const messagesTruncated = messages.slice(-6);

    const embedding = await getEmbedding(
      messagesTruncated.map((message) => message.content).join("\n"),
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
      role: "assistant",
      content:
        "You are an intelligent note-taking app. You answer the user's question based on their existing notes. " +
        "The relevant notes for this query are:\n" +
        relevantNotes
          .map((note) => `Title: ${note.title}\n\nContent:\n${note.content}`)
          .join("\n\n") +
        "\n\nAlways take a look at this before giving a response." +
        "\n\nDo not mention like 'Based on the provided notes, I think...'. Just give the answer.",
    };

    const result = streamText({
      model: google("gemini-1.5-flash"),
      messages: systemMessage ? [systemMessage, ...messages] : messages,
    });

    return result.toDataStreamResponse();
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
