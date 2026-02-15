"use client";

import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1">
          {applyInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-slate-900 mt-4 mb-1">
          {applyInline(line.slice(3))}
        </h2>
      );
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      elements.push(<hr key={i} className="my-2 border-slate-200" />);
      continue;
    }

    // List items
    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-sm text-slate-700">
          {applyInline(line.slice(2))}
        </li>
      );
      continue;
    }

    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      elements.push(
        <li key={i} className="ml-4 list-decimal text-sm text-slate-700">
          {applyInline(numberedMatch[2])}
        </li>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-slate-700">
        {applyInline(line)}
      </p>
    );
  }

  return elements;
}

function applyInline(text: string): React.ReactNode {
  // Split by bold markers **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function ChatMessage({ role, content, loading }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isLoading = loading && !content;

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="group relative max-w-[85%] bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
        {isLoading ? (
          <div className="flex items-center gap-1 py-1">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
            <span
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.15s" }}
            />
            <span
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.3s" }}
            />
          </div>
        ) : (
          <>
            <div className="space-y-0.5">{renderMarkdown(content)}</div>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copiar resposta"
            >
              {copied ? (
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
