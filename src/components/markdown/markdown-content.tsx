"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-6">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-6">{children}</li>,
          h1: ({ children }) => (
            <h1 className="mb-3 text-lg font-semibold leading-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 text-base font-semibold leading-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 text-sm font-semibold leading-tight">
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-border pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className="mb-3 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs leading-5">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 align-top">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
