import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import { Bot, Trash } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CoreMessage } from "ai";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import LoadingButton from "./ui/loading-button";
import { continueChat } from "@/lib/actions/chat";
import { readStreamableValue, StreamableValue } from "ai/rsc";

type IMessageWithId = CoreMessage & { id?: string };

function AIChatbox() {
  const [input, setInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<IMessageWithId[]>([]);

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

    if (isLoading) return;
    if (!input) return;

    const newMsg: IMessageWithId = { content: input, role: "user" };
    const newMessages: IMessageWithId[] = [...messages, newMsg];

    setMessages(newMessages);
    setInput("");

    setIsLoading(true);

    setMessages([
      ...newMessages,
      {
        id: "loading-msg",
        role: "assistant",
        content: "Typing...",
      },
    ]);

    const result = await continueChat(newMessages);

    if ((result as { error: boolean }).error)
      alert("An error occurred. Please try again.");

    for await (const content of readStreamableValue(
      result as StreamableValue<string, any>,
    )) {
      const newMessagesToPass = newMessages.filter(
        (msg) => msg.id !== "loading-msg",
      );

      setMessages([
        ...newMessagesToPass,
        {
          role: "assistant",
          content: content as string,
        },
      ]);
    }

    setIsLoading(false);

    setTimeout(() => inputRef.current?.focus(), 1);
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-[600px] flex-col">
      <div
        className="mt-3 h-full overflow-y-auto scroll-smooth"
        ref={scrollRef}
      >
        {messages.map((msg, index) => (
          <ChatMessage key={msg.id ?? index} message={msg} />
        ))}
        {isLoading && lastMessageIsUser && (
          <ChatMessage
            message={{ role: "assistant", content: "Thinking..." }}
          />
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
  const isAIMessage = role === "assistant";

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
