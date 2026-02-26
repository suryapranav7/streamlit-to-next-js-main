"use client";

import React from "react"

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { studentApi } from "@/lib/api-client";
import { Send, Loader2, Bot, User, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface LearnTabProps {
  studentId: string;
  moduleId: string;
  moduleName: string;
  moduleStatus: string;
}

export function LearnTab({ studentId, moduleId, moduleName, moduleStatus }: LearnTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear chat when module changes
  useEffect(() => {
    setMessages([]);
  }, [moduleId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await studentApi.learn(studentId, userMessage, {
        module_id: moduleId,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: result.response }]);
    } catch (err) {
      console.error("[v0] Learn error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (moduleStatus === "locked") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Module Locked</h3>
          <p className="text-muted-foreground">
            Complete the previous modules first to unlock this content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px] overflow-hidden">
      <CardHeader className="px-6 py-4 border-b shrink-0">
        <CardTitle className="text-lg">Module: {moduleName}</CardTitle>
      </CardHeader>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">AI Tutor Ready</p>
            <p className="text-sm">
              Ask any question about this module and I will help you understand the concepts.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              {message.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
                  }`}
              >
                {/* Render content with Markdown */}
                <div className="text-sm font-sans break-words">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <span className="font-bold">{children}</span>,
                      em: ({ children }) => <span className="italic">{children}</span>,
                      code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
              {message.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-background shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutor a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
