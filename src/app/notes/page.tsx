import { Metadata } from "next";
import Nav from "./Nav";
import { auth } from "@clerk/nextjs";
import prisma from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Notes | NoteSwift",
};

async function NotesPage() {
  const { userId } = auth();

  if (!userId) throw new Error("userId undefined");

  const allNotes = await prisma.note.findMany({ where: { userId } });

  return (
    <div>
      <div>{JSON.stringify(allNotes)}</div>
    </div>
  );
}

export default NotesPage;
