import prisma from "@/lib/db/prisma";
import {
  createNoteSchema,
  deleteNoteSchema,
  updateNoteSchema,
} from "@/lib/validation/note";
import { auth } from "@clerk/nextjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedRes = createNoteSchema.safeParse(body);

    if (!parsedRes.success) {
      console.error(parsedRes.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { title, content } = parsedRes.data;

    const { userId } = auth();
    if (!userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId,
      },
    });

    return Response.json({ note }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsedRes = updateNoteSchema.safeParse(body);

    if (!parsedRes.success) {
      console.error(parsedRes.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id, title, content } = parsedRes.data;

    const note = await prisma.note.findUnique({ where: { id } });

    if (!note)
      return Response.json({ error: "Note not found" }, { status: 404 });

    const { userId } = auth();
    if (!userId || userId !== note.userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title,
        content,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const parsedRes = deleteNoteSchema.safeParse(body);

    if (!parsedRes.success) {
      console.error(parsedRes.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id } = parsedRes.data;

    const note = await prisma.note.findUnique({ where: { id } });

    if (!note)
      return Response.json({ error: "Note not found" }, { status: 404 });

    const { userId } = auth();
    if (!userId || userId !== note.userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.note.delete({ where: { id } });

    return Response.json({ message: "Note deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
