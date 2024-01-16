import { useState } from "react";
import AIChatbox from "./AIChatbox";
import { Button } from "./ui/button";
import { Bot } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

function AIChatButton() {
  return (
    <>
      <Popover onOpenChange={() => console.log("HII")}>
        <PopoverTrigger asChild>
          <Button>
            <Bot size={20} className="mr-2" /> AI Chat
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="z-10 mt-2 w-[500px]">
          <AIChatbox />
        </PopoverContent>
      </Popover>
    </>
  );
}

export default AIChatButton;
