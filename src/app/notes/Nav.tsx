import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function Nav() {
  return (
    <div className="p-4 shadow">
      <div className="flex flex-wrap gap-3 mx-auto max-w-7xl justify-between">
        <Link href="/notes" className="flex items-center gap-1">
          <Image src={logo} alt="NoteSwift logo" width={40} height={40} />
          <span className="font-bold">NoteSwift</span>
        </Link>
        <div className="flex items-center gap-2">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: { avatarBox: { width: "2.5rem", height: "2.5rem" } },
            }}
          />
          <Button>
            <Plus size={20} className="mr-2" />
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Nav;
