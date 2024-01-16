import { Metadata } from "next";
import Nav from "./Nav";
import { auth } from "@clerk/nextjs";
import prisma from "@/lib/db/prisma";
import Note from "@/components/Note";

export const metadata: Metadata = {
  title: "Notes | NoteSwift",
};

async function NotesPage() {
  const { userId } = auth();

  if (!userId) throw new Error("userId undefined");

  const allNotes = await prisma.note.findMany({ where: { userId } });

  return (
    <div className="sm:grid-col-2 grid gap-3 lg:grid-cols-3">
      {!!allNotes.length ? (
        allNotes.map((note) => <Note key={note.id} note={note} />)
      ) : (
        <div className="col-span-full text-center">
          {"You don't have any notes yet. Why don't you create one?"}
        </div>
      )}
    </div>
  );
}

export default NotesPage;
