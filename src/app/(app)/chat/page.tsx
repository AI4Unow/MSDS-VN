"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  PaperPlaneRight,
  BookOpen,
  ChatCircle,
} from "@phosphor-icons/react/dist/ssr";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      <div className="flex items-center gap-2 mb-4">
        <ChatCircle size={24} className="text-primary" />
        <h1 className="text-xl font-bold">Tư vấn tuân thủ</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <BookOpen
                size={40}
                className="mx-auto text-muted-foreground"
              />
              <p className="text-sm text-muted-foreground">
                Hỏi về quy định an toàn hóa chất Việt Nam
              </p>
              <p className="text-xs text-muted-foreground">
                Ví dụ: &quot;Công bố hóa chất theo Circular 01/2026 cần những
                gì?&quot;
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg px-4 py-3 text-sm max-w-[85%] ${
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-card border border-border"
            }`}
          >
            <div className="whitespace-pre-wrap">
              {msg.parts.map((part, i) => {
                if (part.type === "text") return part.text;
                return null;
              })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto rounded-lg px-4 py-3 bg-card border border-border text-sm text-muted-foreground">
            Đang suy nghĩ...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi về quy định..."
          disabled={isLoading}
          className="flex-1 rounded-lg border border-input bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
          aria-label="Gửi"
        >
          <PaperPlaneRight size={18} />
        </button>
      </form>
    </div>
  );
}
