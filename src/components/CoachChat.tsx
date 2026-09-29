"use client";

import { useState, useRef, useEffect } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Who's furthest from their goal time right now?",
  "Which swimmers should be in the A lane for a free set?",
  "How's this group tracking toward the goal meet?",
];

export function CoachChat({ groupId }: { groupId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setMessages(messages); // roll back the optimistic add
        return;
      }
      setMessages([...nextMessages, { role: "assistant", content: data.answer }]);
    } catch {
      setError("Couldn't reach the server. Try again.");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-teal-100 bg-white shadow-sm flex flex-col h-[28rem]">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-slate-500">
              Ask anything about this group's swimmers — times, goals, groupings, recent practices.
            </p>
            <div className="flex flex-col gap-1.5 mt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "self-end bg-teal-600 text-white"
                : "self-start bg-slate-100 text-slate-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="self-start bg-slate-100 text-slate-500 rounded-lg px-3 py-2 text-sm">
            Thinking…
          </div>
        )}
        {error && (
          <div className="self-start bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-slate-100 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this group..."
          className="flex-1 border border-slate-300 rounded-full px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 text-white text-sm rounded-full px-4 py-1.5 hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
