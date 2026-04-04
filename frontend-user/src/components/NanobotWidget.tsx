"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Nanobot-виджет: кнопка в углу → раскрывающееся чат-окно.
 *
 * Подключается к nanobot через WebSocket (/ws/chat).
 * Формат сообщений:
 *   Client → { "message": "текст" }
 *   Server → { "reply": "ответ" }
 */
export default function NanobotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Авто-скролл к последнему сообщению
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket-подключение
  useEffect(() => {
    if (!open) return;

    // Определяем URL: в проде — через Caddy, локально — напрямую
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply ?? "…" },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: event.data },
        ]);
      }
      setLoading(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [open]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const text = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: text }));
    }
  };

  // Кнопка-кружок (закрытое состояние)
  if (!open) {
    return (
      <button
        className="nanobot-toggle"
        onClick={() => setOpen(true)}
        aria-label="Open assistant"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  // Раскрытое окно чата
  return (
    <div className="nanobot-window">
      <div className="nanobot-header">
        <span>
          Assistant{" "}
          <span className={`status-dot ${connected ? "online" : "offline"}`} />
        </span>
        <button className="nanobot-close" onClick={() => setOpen(false)}>
          &times;
        </button>
      </div>

      <div className="nanobot-messages">
        {messages.length === 0 && (
          <div className="msg assistant">
            👋 Hi! Ask me anything about this project.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="msg assistant">Thinking…</div>}
        <div ref={bottomRef} />
      </div>

      <form className="nanobot-input" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something…"
          disabled={loading || !connected}
        />
        <button type="submit" disabled={loading || !input.trim() || !connected}>
          Send
        </button>
      </form>
    </div>
  );
}
