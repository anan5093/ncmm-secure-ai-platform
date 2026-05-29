import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { CitationOverlay } from "../components/CitationOverlay";
import { Footer } from "../components/Footer";
import axios from "axios";

interface Citation {
  citation_id: number;
  chunk_id: string;
  source_path: string;
  source_name: string;
  clearance_level: number;
  document_category: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  latency_ms?: number;
  error?: boolean;
}

const CL_COLORS: Record<number, string> = {
  1: "#10b981",
  2: "#3b82f6",
  3: "#f59e0b",
  4: "#ef4444",
  5: "#8b5cf6",
};
const CL_LABELS: Record<number, string> = {
  1: "RESTRICTED",
  2: "CONFIDENTIAL",
  3: "SECRET",
  4: "TOP SECRET",
  5: "COSMIC TOP SECRET",
};

const ROLE_LABELS: Record<string, string> = {
  ROLE_PORT_INSPECTOR: "Port Inspector",
  ROLE_LOGISTICS_ANALYST: "Logistics Analyst",
  ROLE_MISSION_DIRECTOR: "Mission Director",
  ROLE_SYSADMIN: "Sysadmin",
};

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [synthesisMode, setSynthesisMode] = useState(false);
  const [hoveredCitation, setHoveredCitation] = useState<Citation | null>(null);
  const [citationPos, setCitationPos] = useState({ top: 0, left: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuery = async () => {
    if (!query.trim() || loading) return;
    const userQuery = query.trim();
    setQuery("");
    setLoading(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userQuery,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await axios.post("/api/v1/query", {
        query: userQuery,
        synthesis_mode: synthesisMode,
      });
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.response_text || "No response received.",
        citations: res.data.citations || [],
        latency_ms: res.data.query_latency_ms,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          err?.response?.data?.error ||
          "Query failed. Check that all services are running.",
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const renderContent = (content: string) => {
    // Plain text render — no dangerouslySetInnerHTML
    return content.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };

  const clColor = CL_COLORS[user?.clearance_level || 1];
  const clLabel = CL_LABELS[user?.clearance_level || 1];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0a0e1a",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(99,102,241,0.2)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#111827",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "1.25rem" }}>🔐</span>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "#f1f5f9",
              }}
            >
              NCMM Intelligence Platform
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              {ROLE_LABELS[user?.role || ""] || user?.role} · {user?.department}
              {user?.assigned_port ? ` · ${user.assigned_port}` : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Clearance badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: `${clColor}15`,
              border: `1px solid ${clColor}40`,
              borderRadius: "6px",
              padding: "4px 10px",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: clColor,
                display: "inline-block",
              }}
            />
            <span
              style={{ color: clColor, fontSize: "0.75rem", fontWeight: 600 }}
            >
              {clLabel}
            </span>
          </div>

          {/* Synthesis mode toggle */}
          <label
            id="synthesis-mode-toggle"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={synthesisMode}
              onChange={(e) => setSynthesisMode(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#6366f1" }}
            />
            <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
              Synthesis Mode
            </span>
          </label>

          <button
            id="logout-btn"
            onClick={logout}
            style={{
              background: "transparent",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "6px",
              color: "#f87171",
              padding: "6px 14px",
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "80px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#f1f5f9",
                marginBottom: "8px",
              }}
            >
              NCMM Secure Intelligence Query
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9375rem" }}>
              Query classified mineral intelligence within your clearance level
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                    : msg.error
                      ? "rgba(239,68,68,0.1)"
                      : "#1a2235",
                border:
                  msg.role === "assistant"
                    ? `1px solid ${msg.error ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.2)"}`
                    : "none",
                borderRadius:
                  msg.role === "user"
                    ? "16px 16px 4px 16px"
                    : "4px 16px 16px 16px",
                padding: "14px 18px",
                lineHeight: 1.6,
                fontSize: "0.9375rem",
                color: "#f1f5f9",
              }}
            >
              {/* Message content — plain text only */}
              <div>{renderContent(msg.content)}</div>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  {msg.citations.map((c) => (
                    <button
                      key={c.citation_id}
                      id={`citation-btn-${msg.id}-${c.citation_id}`}
                      onMouseEnter={(e) => {
                        const rect = (
                          e.target as HTMLElement
                        ).getBoundingClientRect();
                        setCitationPos({
                          top: rect.bottom + 8,
                          left: rect.left,
                        });
                        setHoveredCitation(c);
                      }}
                      onMouseLeave={() => setHoveredCitation(null)}
                      style={{
                        background: `${CL_COLORS[c.clearance_level] || "#64748b"}20`,
                        border: `1px solid ${CL_COLORS[c.clearance_level] || "#64748b"}40`,
                        borderRadius: "4px",
                        padding: "2px 8px",
                        color: CL_COLORS[c.clearance_level] || "#64748b",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      [{c.citation_id}]
                    </button>
                  ))}
                </div>
              )}

              {/* Latency */}
              {msg.latency_ms && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "0.7rem",
                    color: "#475569",
                  }}
                >
                  ⚡ {msg.latency_ms}ms
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                background: "#1a2235",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "4px 16px 16px 16px",
                padding: "14px 18px",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#6366f1",
                      display: "inline-block",
                      animation: `bounce 1.2s ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: "1px solid rgba(99,102,241,0.2)",
          padding: "16px 24px",
          background: "#111827",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <textarea
            ref={textareaRef}
            id="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about critical mineral stockpiles, port manifests, supply chain assessments..."
            rows={2}
            maxLength={1024}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "#0f172a",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "10px",
              color: "#f1f5f9",
              fontSize: "0.9375rem",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
          />
          <button
            id="send-query-btn"
            onClick={sendQuery}
            disabled={!query.trim() || loading}
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.9375rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: !query.trim() || loading ? 0.6 : 1,
              transition: "opacity 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            Send
          </button>
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "#475569",
            marginTop: "6px",
            maxWidth: "900px",
            margin: "6px auto 0",
          }}
        >
          Enter to send · Shift+Enter for new line · Max 1024 characters
        </div>
      </div>

      {/* Citation overlay */}
      <CitationOverlay
        citation={hoveredCitation}
        onClose={() => setHoveredCitation(null)}
        style={{
          top: citationPos.top,
          left: Math.min(citationPos.left, window.innerWidth - 400),
        }}
      />

      {/* Footer */}
      <Footer />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
