"use client";

import { MarkdownContent } from "@/components/markdown/markdown-content";

type ChatMarkdownProps = {
  content: string;
};

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return <MarkdownContent content={content} />;
}
