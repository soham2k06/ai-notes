"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddNoteDialog from "@/components/AddEditNoteDialog";
import ThemeToggle from "@/components/ThemeToggle";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import AIChatButton from "@/components/AIChatButton";

function Nav() {
  const { theme } = useTheme();
  const [showAddEditNoteDialog, setShowAddEditNoteDialog] = useState(false);
  return (
    <>
      <div className="shadow">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 p-4">
          <Link href="/notes" className="flex items-center gap-1">
            <Image
              src={logo}
              alt="NoteSwift logo"
              width={50}
              height={50}
              className="dark:invert"
            />

            <span className="font-bold">NoteSwift</span>
          </Link>
          <div className="flex items-center gap-2">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: {
                  avatarBox: {
                    width: "2.5rem",
                    height: "2.5rem",
                    backgroundColor: "white",
                  },
                },
              }}
            />
            <ThemeToggle />
            <Button onClick={() => setShowAddEditNoteDialog(true)}>
              <Plus size={20} className="mr-2" />
              Add Note
            </Button>
            <AIChatButton />
          </div>
        </div>
      </div>
      <AddNoteDialog
        open={showAddEditNoteDialog}
        setOpen={setShowAddEditNoteDialog}
      />
    </>
  );
}

export default Nav;
