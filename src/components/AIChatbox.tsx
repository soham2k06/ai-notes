import { cn } from "@/lib/utils";
import { useChat } from "ai/react";
import { Bot, Trash, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Message } from "ai";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useRef } from "react";
import LoadingButton from "./ui/loading-button";

function AIChatbox() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
    error,
  } = useChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleClearChat() {
    // Clear messages and local storage
    localStorage.removeItem("chatMessages");
    setMessages([]);
  }

  useEffect(() => {
    if (scrollRef.current && !isLoading) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const lastMessageIsUser = messages.at(-1)?.role === "user";

  useEffect(() => {
    // Save messages to local storage whenever they change
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  return (
    <div className="flex h-[600px] flex-col">
      <div className="mt-3 h-full overflow-y-auto" ref={scrollRef}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && lastMessageIsUser && (
          <ChatMessage
            message={{ role: "assistant", content: "Thinking..." }}
          />
        )}
        {error && (
          <ChatMessage
            message={{
              role: "assistant",
              content: "Something went wrong! Please try again.",
            }}
          />
        )}
        {!error && !messages.length && (
          <div className="flex h-full items-center justify-center gap-3">
            <Bot />
            Ask the AI a question about your notes
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          type="button"
          disabled={isLoading || !messages.length}
          onClick={handleClearChat}
          title="Clear chat"
        >
          <Trash />
        </Button>
        <Input
          autoFocus
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
          placeholder="Say something..."
        />
        <LoadingButton
          loading={isLoading}
          type="submit"
          disabled={isLoading || !input.length}
        >
          Send
        </LoadingButton>
      </form>
    </div>
  );
}

function ChatMessage({
  message: { role, content },
}: {
  message: Pick<Message, "role" | "content">;
}) {
  const { user } = useUser();
  const isAIMessage = role === "assistant";

  return (
    <div
      className={cn(
        "mb-3 flex items-center",
        isAIMessage ? "me-5 justify-start" : "ms-5 justify-end",
      )}
    >
      {isAIMessage && (
        <Bot
          className="mr-2 shrink-0 rounded-full bg-primary p-1 text-primary-foreground"
          size={36}
        />
      )}
      <p
        className={cn(
          "whitespace-pre-line rounded-md border px-3 py-2",
          isAIMessage ? "bg-background" : "bg-primary text-primary-foreground",
        )}
      >
        {content}
      </p>
      {!isAIMessage && user?.imageUrl && (
        <Image
          src={user.imageUrl}
          alt="User image"
          width={100}
          height={100}
          className="ml-2 h-10 w-10 rounded-full bg-primary object-cover"
        />
      )}
    </div>
  );
}

export default AIChatbox;
