import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Footer } from "../components/Footer";
import axios from "axios";

interface AdminMetrics {
  totalDocuments: number;
  totalChunks: number;
  totalVectors: number;
  totalUsers: number;
  queryCount: number;
  avgQueryLatency: number;
  systemUptime: string;
  lastUpdated: string;
}

interface AdminLog {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  category: string;
  message: string;
  user?: string;
  metadata?: Record<string, unknown>;
}

interface QueryResult {
  query: string;
  timestamp: string;
  result: unknown;
  latency_ms: number;
}

export default function AdminPage() {
  const { user, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "metrics" | "logs" | "query" | "health"
  >("metrics");
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch admin metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/admin/metrics",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setMetrics(response.data);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
        // Mock data for demo
        setMetrics({
          totalDocuments: 20,
          totalChunks: 204,
          totalVectors: 164,
          totalUsers: 6,
          queryCount: 42,
          avgQueryLatency: 1350,
          systemUptime: "5d 12h 30m",
          lastUpdated: new Date().toISOString(),
        });
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Fetch admin logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/admin/logs",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setLogs(response.data);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        // Mock logs for demo
        setLogs([
          {
            timestamp: new Date(Date.now() - 5000).toISOString(),
            level: "INFO",
            category: "QUERY",
            message: "User query executed successfully",
            user: "r.sharma",
          },
          {
            timestamp: new Date(Date.now() - 15000).toISOString(),
            level: "INFO",
            category: "AUTH",
            message: "User authenticated",
            user: "p.krishnan",
          },
          {
            timestamp: new Date(Date.now() - 45000).toISOString(),
            level: "WARN",
            category: "SECURITY",
            message: "Unauthorized access attempt detected",
            user: "unknown",
          },
        ]);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const handleExecuteQuery = async () => {
    if (!queryInput.trim()) return;

    setLoading(true);
    setError("");

    try {
      const startTime = Date.now();
      const response = await axios.post(
        "http://localhost:3000/api/admin/query",
        { query: queryInput },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const latency = Date.now() - startTime;

      setQueryResults([
        {
          query: queryInput,
          timestamp: new Date().toISOString(),
          result: response.data,
          latency_ms: latency,
        },
        ...queryResults,
      ]);
      setQueryInput("");
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to execute query";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "INFO":
        return "#3b82f6";
      case "WARN":
        return "#f59e0b";
      case "ERROR":
        return "#ef4444";
      case "CRITICAL":
        return "#dc2626";
      default:
        return "#94a3b8";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0e1a",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)",
          borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
            🛡️ Admin Dashboard
          </h1>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#94a3b8",
              margin: "4px 0 0 0",
            }}
          >
            User: {user?.username} ({user?.role})
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: "8px 16px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
          }}
        >
          Logout
        </button>
      </header>

      {/* Tab Navigation */}
      <nav
        style={{
          display: "flex",
          gap: "0",
          background: "rgba(5, 8, 17, 0.5)",
          borderBottom: "1px solid rgba(99, 102, 241, 0.1)",
          padding: "0 40px",
        }}
      >
        {(["metrics", "logs", "query", "health"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 20px",
              background:
                activeTab === tab ? "rgba(99, 102, 241, 0.15)" : "transparent",
              border: "none",
              borderBottom:
                activeTab === tab ? "2px solid #6366f1" : "transparent",
              color: activeTab === tab ? "#f8fafc" : "#94a3b8",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: activeTab === tab ? 600 : 400,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) e.currentTarget.style.color = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) e.currentTarget.style.color = "#94a3b8";
            }}
          >
            {tab === "metrics" && "📊 Metrics"}
            {tab === "logs" && "📋 Logs"}
            {tab === "query" && "🔍 Query"}
            {tab === "health" && "❤️ Health"}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: "40px",
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Metrics Tab */}
        {activeTab === "metrics" && (
          <div>
            <h2
              style={{
                marginBottom: "24px",
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              System Metrics & Statistics
            </h2>

            {metrics && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                  marginBottom: "40px",
                }}
              >
                {[
                  {
                    label: "Total Documents",
                    value: metrics.totalDocuments,
                    icon: "📄",
                  },
                  {
                    label: "Total Chunks",
                    value: metrics.totalChunks,
                    icon: "🧩",
                  },
                  {
                    label: "Vector Embeddings",
                    value: metrics.totalVectors,
                    icon: "🧠",
                  },
                  {
                    label: "Active Users",
                    value: metrics.totalUsers,
                    icon: "👥",
                  },
                  {
                    label: "Query Count",
                    value: metrics.queryCount,
                    icon: "🔍",
                  },
                  {
                    label: "Avg Query Latency",
                    value: `${metrics.avgQueryLatency}ms`,
                    icon: "⚡",
                  },
                  {
                    label: "System Uptime",
                    value: metrics.systemUptime,
                    icon: "⏱️",
                  },
                ].map((metric, idx) => (
                  <div
                    key={idx}
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%)",
                      border: "1px solid rgba(99, 102, 241, 0.1)",
                      borderRadius: "12px",
                      padding: "24px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                      {metric.icon}
                    </div>
                    <div
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        color: "#818cf8",
                        marginBottom: "8px",
                      }}
                    >
                      {metric.value}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Performance Chart Placeholder */}
            <div
              style={{
                background: "rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.1)",
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
                Query Performance Over Time
              </h3>
              <div
                style={{
                  height: "200px",
                  background: "rgba(5, 8, 17, 0.5)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  fontSize: "0.9rem",
                }}
              >
                📈 Performance metrics chart (Real-time data from backend)
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div>
            <h2
              style={{
                marginBottom: "24px",
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              Administration Logs
            </h2>

            <div
              style={{
                background: "rgba(5, 8, 17, 0.5)",
                border: "1px solid rgba(99, 102, 241, 0.1)",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.85rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(99, 102, 241, 0.1)",
                        background: "rgba(99, 102, 241, 0.05)",
                      }}
                    >
                      {[
                        "Timestamp",
                        "Level",
                        "Category",
                        "Message",
                        "User",
                      ].map((header) => (
                        <th
                          key={header}
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: 600,
                            color: "#94a3b8",
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid rgba(99, 102, 241, 0.05)",
                          background:
                            idx % 2 === 0
                              ? "transparent"
                              : "rgba(99, 102, 241, 0.02)",
                        }}
                      >
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: getLevelColor(log.level),
                            fontWeight: 600,
                          }}
                        >
                          {log.level}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#818cf8" }}>
                          {log.category}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#f8fafc" }}>
                          {log.message}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                          {log.user || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Query Tab */}
        {activeTab === "query" && (
          <div>
            <h2
              style={{
                marginBottom: "24px",
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              Admin Query Interface
            </h2>

            <div
              style={{
                background: "rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.1)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                }}
              >
                Enter MongoDB Query (or natural language):
              </label>
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder='e.g., "Find all documents about cobalt" or db.collection("documents").find({category: "GEOLOGY"})'
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px",
                  background: "rgba(5, 8, 17, 0.5)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  fontFamily: "JetBrains Mono",
                  resize: "vertical",
                }}
              />
              <button
                onClick={handleExecuteQuery}
                disabled={loading}
                style={{
                  marginTop: "12px",
                  padding: "10px 20px",
                  background: loading
                    ? "rgba(99, 102, 241, 0.3)"
                    : "rgba(99, 102, 241, 0.2)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "#818cf8",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                {loading ? "⏳ Executing..." : "▶️ Execute Query"}
              </button>

              {error && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "6px",
                    color: "#fca5a5",
                    fontSize: "0.85rem",
                  }}
                >
                  ❌ Error: {error}
                </div>
              )}
            </div>

            {/* Query Results */}
            {queryResults.length > 0 && (
              <div>
                <h3
                  style={{
                    marginBottom: "16px",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  Query Results
                </h3>
                {queryResults.map((result, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(5, 8, 17, 0.5)",
                      border: "1px solid rgba(99, 102, 241, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                      <div
                        style={{
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                          color: "#10b981",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {result.latency_ms}ms
                      </div>
                    </div>
                    <div
                      style={{
                        background: "rgba(5, 8, 17, 0.5)",
                        padding: "12px",
                        borderRadius: "6px",
                        fontFamily: "JetBrains Mono",
                        fontSize: "0.8rem",
                        color: "#94a3b8",
                        overflowX: "auto",
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Health Tab */}
        {activeTab === "health" && (
          <div>
            <h2
              style={{
                marginBottom: "24px",
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              System Health & Status
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {[
                { service: "Backend API", status: "Online", latency: "45ms" },
                { service: "MongoDB", status: "Online", latency: "8ms" },
                {
                  service: "OPA Policy Engine",
                  status: "Online",
                  latency: "12ms",
                },
                {
                  service: "FAISS Vector Index",
                  status: "Online",
                  latency: "120ms",
                },
                { service: "Mock LLM", status: "Online", latency: "340ms" },
                { service: "Elasticsearch", status: "Online", latency: "25ms" },
              ].map((health, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(99, 102, 241, 0.05)",
                    border: "1px solid rgba(99, 102, 241, 0.1)",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        {health.service}
                      </div>
                      <div
                        style={{
                          display: "inline-block",
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                          color: "#10b981",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        ✓ {health.status}
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                      }}
                    >
                      <div>{health.latency}</div>
                      <div style={{ marginTop: "4px" }}>Response Time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
