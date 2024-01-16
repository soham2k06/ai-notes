import { notesIndex } from "@/lib/db/pinecone";
import prisma from "@/lib/db/prisma";
import { getEmbedding, openai } from "@/lib/openai";
import { auth } from "@clerk/nextjs";
import { ChatCompletionMessage } from "openai/resources/index.mjs";
import { OpenAIStream, StreamingTextResponse } from "ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: ChatCompletionMessage[] = body.messages;
    const truncatedMessages = messages.slice(-6);

    const embedding = await getEmbedding(
      truncatedMessages.map((msg) => msg.content).join("\n"),
    );

    const { userId } = auth();

    const verctorQueryResponse = await notesIndex.query({
      vector: embedding,
      topK: 4,
      filter: { userId },
    });
    const relevantNotes = await prisma.note.findMany({
      where: {
        id: {
          in: verctorQueryResponse.matches.map((match) => match.id),
        },
      },
    });
    console.log("Relevent notes found: ", relevantNotes);

    const systemMessage: ChatCompletionMessage = {
      role: "system",
      content:
        "You are an intelligent note-taking app. You answer the user's question based on their exisiting notes. " +
        "The relevent notes for this query are: \n" +
        relevantNotes
          .map((note) => `Title: ${note.title}\n\nContent:\n${note.content}`)
          .join("\n\n"),
    };

    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      stream: true,
      messages: [systemMessage, ...truncatedMessages],
    });

    const stream = OpenAIStream(res);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal" }, { status: 500 });
  }
}
