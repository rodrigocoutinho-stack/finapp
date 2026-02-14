"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ChatMessage } from "@/components/assistente/chat-message";
import { ChatInput } from "@/components/assistente/chat-input";
import { useToast } from "@/contexts/toast-context";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "Como está minha saúde financeira?",
  "Minhas despesas estão controladas?",
  "Minha carteira está diversificada?",
  "Tenho reserva de emergência?",
];

let nextMsgId = 0;

export default function AssistentePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: nextMsgId++,
      role: "user",
      content: text.trim(),
    };
    const assistantMsg: Message = {
      id: nextMsgId++,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build conversation history (last 10 messages = 5 pairs)
      const finishedMessages = messages.filter((m) => m.content.length > 0);
      const history = finishedMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        const errorMsg =
          err?.error || `Erro ${response.status}`;
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error("Resposta sem conteúdo.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        const currentText = accumulated;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: currentText } : m
          )
        );
      }

      // Final decode
      accumulated += decoder.decode();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: accumulated } : m
        )
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao conectar com o assistente.";
      addToast(errorMessage, "error");

      // Remove empty assistant message on error
      setMessages((prev) =>
        prev.filter(
          (m) => !(m.id === assistantMsg.id && m.content === "")
        )
      );

      // If there's partial content, keep it
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id && m.content
            ? { ...m, content: m.content + "\n\n---\n*Resposta interrompida.*" }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    sendMessage(input);
  }

  function handleSuggestion(question: string) {
    sendMessage(question);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] lg:h-[calc(100vh-1rem)]">
      <PageHeader
        title="Assistente Financeiro"
        description="Análise inteligente dos seus dados com IA"
      />

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-1 pb-4"
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            {/* Sparkles icon */}
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Olá! Sou o FinAssist
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md">
              Analiso seus dados financeiros reais para fornecer diagnósticos
              personalizados, orientações de orçamento e sugestões de carteira.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSuggestion(question)}
                  disabled={loading}
                  className="text-left px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-300 text-sm text-slate-700 transition-colors disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto pt-2">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                loading={loading && msg.role === "assistant" && msg.content === ""}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 max-w-3xl mx-auto w-full pt-2 pb-2">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={loading}
        />
        <p className="text-xs text-slate-400 text-center mt-1.5">
          Baseado nos seus dados reais. Não substitui aconselhamento financeiro profissional.
        </p>
      </div>
    </div>
  );
}
