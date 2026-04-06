"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Nanobot widget — connects to nanobot webchat via WebSocket.
 * Protocol:
 *   Client → { "content": "message" }
 *   Server → { "type": "text", "content": "reply" }
 */
export default function NanobotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket connection
  useEffect(() => {
    if (!open) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const accessKey = "projectset-secret-key";
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?access_key=${accessKey}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to nanobot");
      setConnected(true);
    };
    ws.onclose = () => {
      console.log("Disconnected from nanobot");
      setConnected(false);
    };
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Nanobot structured message: {type, content}
        const content = data.content ?? JSON.stringify(data);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content },
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
      wsRef.current.send(JSON.stringify({ content: text }));
    }
  };

  // Collapsed — toggle button
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

  // Expanded — chat window
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
            👋 Hi! Ask me about games, prices, or recommendations.
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
          placeholder={connected ? "Ask something…" : "Connecting…"}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
