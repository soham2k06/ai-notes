import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import { Bot, Trash } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import LoadingButton from "./ui/loading-button";
import { CoreMessage } from "@/lib/types";

type IMessageWithId = CoreMessage & { id?: string };

async function streamChatResponse(
  history: CoreMessage[],
  onChunk?: (chunk: string) => void,
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ history }),
  });

  if (!res.body) throw new Error("No response body from server.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    accumulated += chunk;

    if (onChunk) onChunk(chunk);
  }

  reader.releaseLock();
  return accumulated;
}

function AIChatbox() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClearChat() {
    setMessages([]);
  }

  const lastMessageIsUser = messages.at(-1)?.role === "user";

  async function handleGenerate(
    e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent,
  ) {
    e.preventDefault();
    if (!input || isLoading) return;

    const userMsg: CoreMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Temporary loading message
    const loadingMsg: CoreMessage = {
      id: "loading-msg",
      role: "model",
      content: "",
    };
    setMessages((prev) => [...prev, loadingMsg]);

    // Capture only the conversation history (exclude loading message)
    const history = [...messages, userMsg];

    await streamChatResponse(history, (chunk) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === "loading-msg"
            ? { ...msg, content: msg.content + chunk } // append chunk
            : msg,
        ),
      );
    });

    // Remove loading-msg ID (optional, or keep it with final content)
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === "loading-msg" ? { ...msg, id: undefined } : msg,
      ),
    );

    setTimeout(() => inputRef.current?.focus(), 100);

    setIsLoading(false);
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  console.log(messages);

  return (
    <div className="flex h-[600px] flex-col">
      <div
        className="mt-3 h-full overflow-y-auto scroll-smooth"
        ref={scrollRef}
      >
        {messages.map((msg, index) => (
          <ChatMessage key={msg.id ?? index} message={msg as CoreMessage} />
        ))}
        {isLoading && lastMessageIsUser && (
          <ChatMessage message={{ role: "model", content: "Thinking..." }} />
        )}
        {!messages.length && (
          <div className="flex h-full items-center justify-center gap-3">
            <Bot />
            Ask the AI a question about your notes
          </div>
        )}
      </div>
      <form onSubmit={handleGenerate} className="flex gap-2">
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
          onChange={(e) => setInput(e.target.value)}
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
  message: { id, role, content },
}: {
  message: IMessageWithId;
}) {
  const { user } = useUser();
  const isAIMessage = role === "model";

  return (
    <div
      className={cn(
        "mb-5 flex items-center",
        isAIMessage ? "me-5 justify-start" : "ms-5 justify-end",
      )}
    >
      {isAIMessage && (
        <Bot
          className="mr-2 shrink-0 rounded-full bg-primary p-1 text-primary-foreground"
          size={36}
        />
      )}
      {isAIMessage ? (
        <Markdown className="prose bg-background leading-8 text-foreground/75">
          {content as string}
        </Markdown>
      ) : id === "loading-msg" ? (
        <span className="inline-block size-6 animate-pulse rounded-full bg-muted-foreground"></span>
      ) : (
        <p className="whitespace-pre-line rounded-md border bg-muted px-3 py-2 text-foreground/80">
          {content as string}
        </p>
      )}
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
