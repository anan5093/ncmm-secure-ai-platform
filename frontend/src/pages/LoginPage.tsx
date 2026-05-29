import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === "ROLE_SYSADMIN") {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "Authentication failed. Check credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  // Predefined credentials matching README / seed policies
  const credentials = [
    {
      username: "s.iyer",
      password: "mission-director-pass-2025",
      role: "Mission Director",
      cl: 5,
      clName: "COSMIC TOP SECRET",
      color: "var(--cl-5)",
    },
    {
      username: "p.krishnan",
      password: "logistics-analyst-pass-2025",
      role: "Logistics Analyst",
      cl: 3,
      clName: "SECRET",
      color: "var(--cl-3)",
    },
    {
      username: "r.sharma",
      password: "vizag-inspector-pass-2025",
      role: "Port Inspector (VIZAG)",
      cl: 2,
      clName: "CONFIDENTIAL",
      color: "var(--cl-2)",
    },
    {
      username: "a.mehta",
      password: "jnpt-inspector-pass-2025",
      role: "Port Inspector (JNPT)",
      cl: 2,
      clName: "CONFIDENTIAL",
      color: "var(--cl-2)",
    },
    {
      username: "admin",
      password: "sysadmin-pass-2025",
      role: "Sysadmin",
      cl: 1,
      clName: "RESTRICTED",
      color: "var(--cl-1)",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12), transparent), #050811",
        position: "relative",
      }}
    >
      {/* Background Orbs */}
      <div className="bg-glow-orb bg-glow-left" />
      <div className="bg-glow-orb bg-glow-right" />

      {/* 2. HEADER NAVBAR */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(5, 8, 17, 0.75)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(99, 102, 241, 0.1)",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🔐</span>
          <span
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              background: "linear-gradient(135deg, #f8fafc, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            NCMM SECURE-INTEL
          </span>
        </div>
        <nav style={{ display: "flex", gap: "24px" }}>
          <a
            href="#login"
            style={{ fontSize: "0.9rem", fontWeight: 500, color: "#f8fafc" }}
          >
            Secure Terminal
          </a>
          <a
            href="#stats"
            style={{ fontSize: "0.9rem", fontWeight: 500, color: "#94a3b8" }}
          >
            Operational Stats
          </a>
          <a
            href="#vision"
            style={{ fontSize: "0.9rem", fontWeight: 500, color: "#94a3b8" }}
          >
            Our Vision
          </a>
          <a
            href="#inspirations"
            style={{ fontSize: "0.9rem", fontWeight: 500, color: "#94a3b8" }}
          >
            Inspirations
          </a>
        </nav>
      </header>

      {/* MAIN VIEW CONTAINER */}
      <main
        style={{
          flex: 1,
          padding: "40px 24px",
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Split Section: Left Login, Right Stats */}
        <section
          id="login"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 420px) 1fr",
            gap: "40px",
            alignItems: "start",
            marginBottom: "80px",
            animation: "fadeIn 0.8s ease-out",
          }}
        >
          {/* LEFT: LOGIN UI BOX */}
          <div
            className="glass-card"
            style={{
              padding: "32px",
              position: "relative",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              boxShadow: "0 0 30px rgba(99, 102, 241, 0.1)",
            }}
          >
            <div style={{ marginBottom: "28px", textAlign: "center" }}>
              <h2
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  marginBottom: "8px",
                }}
              >
                Secure Login
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                Enter credentials to establish a policy-scoped session
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="login-username"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#94a3b8",
                    marginBottom: "8px",
                  }}
                >
                  System Identifier (Username)
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  className="input-field"
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  htmlFor="login-password"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#94a3b8",
                    marginBottom: "8px",
                  }}
                >
                  Security Passkey (Password)
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                  className="input-field"
                />
              </div>

              {error && (
                <div
                  id="login-error"
                  role="alert"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "20px",
                    color: "#fca5a5",
                    fontSize: "0.825rem",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading || !username || !password}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: loading
                    ? "#4f46e5"
                    : "linear-gradient(135deg, #6366f1, #4f46e5)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
                  opacity: loading ? 0.8 : 1,
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                {loading ? "Decrypting Session..." : "Authenticate & Enter"}
              </button>
            </form>

            {/* Credentials Quick-Access (Marked with Clearance Levels) */}
            <div
              style={{
                marginTop: "28px",
                borderTop: "1px solid rgba(99, 102, 241, 0.1)",
                paddingTop: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  marginBottom: "12px",
                  letterSpacing: "0.02em",
                }}
              >
                Operational Personnel (Click to Autofill):
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {credentials.map((cred) => (
                  <button
                    key={cred.username}
                    onClick={() => handleAutofill(cred.username, cred.password)}
                    type="button"
                    style={{
                      width: "100%",
                      background: "rgba(99, 102, 241, 0.03)",
                      border: "1px solid rgba(99, 102, 241, 0.08)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease-in-out",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(99, 102, 241, 0.08)";
                      e.currentTarget.style.borderColor =
                        "rgba(99, 102, 241, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(99, 102, 241, 0.03)";
                      e.currentTarget.style.borderColor =
                        "rgba(99, 102, 241, 0.08)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#f8fafc",
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "0.8rem",
                        }}
                      >
                        {cred.username}
                      </span>
                      <span className={`badge-cl badge-cl-${cred.cl}`}>
                        CL{cred.cl}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                      }}
                    >
                      <span>{cred.role}</span>
                      <span style={{ color: cred.color, fontWeight: 500 }}>
                        {cred.clName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: BENTO GRID INFO & STATISTICS */}
          <div
            id="stats"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Bento Card 1: Core System Telemetry */}
            <div
              className="glass-card"
              style={{ padding: "24px", gridColumn: "span 2" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    color: "#f8fafc",
                  }}
                >
                  System Telemetry
                </h3>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  ACTIVE
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "16px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    background: "rgba(99,102,241,0.03)",
                    border: "1px solid rgba(99,102,241,0.06)",
                    padding: "12px 8px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "#818cf8",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    20
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#94a3b8",
                      marginTop: "4px",
                    }}
                  >
                    Classified Docs
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(99,102,241,0.03)",
                    border: "1px solid rgba(99,102,241,0.06)",
                    padding: "12px 8px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "#818cf8",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    400+
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#94a3b8",
                      marginTop: "4px",
                    }}
                  >
                    Vector Chunks
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(99,102,241,0.03)",
                    border: "1px solid rgba(99,102,241,0.06)",
                    padding: "12px 8px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "#818cf8",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    91
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#94a3b8",
                      marginTop: "4px",
                    }}
                  >
                    Unit Tests
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(99,102,241,0.03)",
                    border: "1px solid rgba(99,102,241,0.06)",
                    padding: "12px 8px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "#818cf8",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    80+
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#94a3b8",
                      marginTop: "4px",
                    }}
                  >
                    Security Tests
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  lineHeight: 1.5,
                }}
              >
                The database is fully populated with real port manifests (JNPT &
                VIZAG) and mineral procurement strategies scoped across multiple
                clearance levels.
              </div>
            </div>

            {/* Bento Card 2: Security Architecture */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  marginBottom: "14px",
                }}
              >
                Firewall Architecture
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      color: "var(--color-success)",
                      fontSize: "0.85rem",
                    }}
                  >
                    ✔
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                    <strong>L1:</strong> NFKC Unicode Normalization
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      color: "var(--color-success)",
                      fontSize: "0.85rem",
                    }}
                  >
                    ✔
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                    <strong>L2:</strong> Toxic-BERT Intent ONNX
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      color: "var(--color-success)",
                      fontSize: "0.85rem",
                    }}
                  >
                    ✔
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                    <strong>L3:</strong> Namespace XML Vault
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      color: "var(--color-success)",
                      fontSize: "0.85rem",
                    }}
                  >
                    ✔
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                    Defense-in-depth ABAC check
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: RAG Processing Pipeline */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  marginBottom: "14px",
                }}
              >
                RAG Engine Specs
              </h3>
              <ul
                style={{
                  listStyleType: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                }}
              >
                <li
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    paddingBottom: "4px",
                  }}
                >
                  <span>Embedding Dimension</span>
                  <span
                    style={{ color: "#f8fafc", fontFamily: "JetBrains Mono" }}
                  >
                    384 (MiniLM-L6)
                  </span>
                </li>
                <li
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    paddingBottom: "4px",
                  }}
                >
                  <span>Semantic Vector Index</span>
                  <span
                    style={{ color: "#f8fafc", fontFamily: "JetBrains Mono" }}
                  >
                    FAISS HNSW
                  </span>
                </li>
                <li
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    paddingBottom: "4px",
                  }}
                >
                  <span>Lexical Text Match</span>
                  <span
                    style={{ color: "#f8fafc", fontFamily: "JetBrains Mono" }}
                  >
                    Wink-BM25
                  </span>
                </li>
                <li
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    paddingBottom: "4px",
                  }}
                >
                  <span>Rerank Model</span>
                  <span
                    style={{ color: "#f8fafc", fontFamily: "JetBrains Mono" }}
                  >
                    MS-MARCO ONNX
                  </span>
                </li>
                <li
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "2px",
                  }}
                >
                  <span>Fusion Algorithm</span>
                  <span
                    style={{ color: "#f8fafc", fontFamily: "JetBrains Mono" }}
                  >
                    RRF (k=60)
                  </span>
                </li>
              </ul>
            </div>

            {/* Bento Card 4: Access Control Protocols */}
            <div
              className="glass-card"
              style={{ padding: "24px", gridColumn: "span 2" }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  marginBottom: "12px",
                }}
              >
                OPA Authorization Protocol
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  marginBottom: "12px",
                  lineHeight: 1.5,
                }}
              >
                Every data fetch and query submission is checked against an OPA
                policy (REGO) to ensure separation of duties. Below is the
                active classification mapping.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span className="badge-cl badge-cl-5">
                  CL5 COSMIC TOP SECRET (Director)
                </span>
                <span className="badge-cl badge-cl-4">
                  CL4 TOP SECRET (Strategic HQ)
                </span>
                <span className="badge-cl badge-cl-3">
                  CL3 SECRET (Logistics Analyst)
                </span>
                <span className="badge-cl badge-cl-2">
                  CL2 CONFIDENTIAL (Port Inspector)
                </span>
                <span className="badge-cl badge-cl-1">
                  CL1 RESTRICTED (Sysadmin)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 1. VISION SECTION */}
        <section
          id="vision"
          className="glass-card"
          style={{
            padding: "40px",
            marginBottom: "60px",
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.15)",
          }}
        >
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: "24px",
              color: "#f8fafc",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            Vision & Critical Mandate
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(300px, 1fr) 1.5fr",
              gap: "40px",
              alignItems: "stretch",
            }}
          >
            {/* LEFT: Vision Image Section */}
            <div
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                display: "flex"
              }}
            >
              <img 
                src="/vision.jpg" 
                alt="National Critical Mineral Mission Vision" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* RIGHT: Vision Text with SEO Keywords & Badge */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "24px"
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "1rem",
                  lineHeight: 1.7,
                }}
              >
                <p style={{ marginBottom: "16px" }}>
                  As India embarks on the transformative journey of <strong style={{ color: "#f8fafc" }}>Viksit Bharat 2047</strong>, critical minerals will continue to play a pivotal role in the nation’s strategic progress. Initiated in the Union Budget 2024-25, the <strong style={{ color: "#f8fafc" }}>National Critical Mineral Mission (NCMM)</strong> envisions securing a long-term, <strong style={{ color: "#f8fafc" }}>sustainable supply of critical minerals</strong> to fuel green technology and defense innovations.
                </p>
                <p style={{ marginBottom: "16px" }}>
                  Our mandate focuses on strengthening India’s <strong style={{ color: "#f8fafc" }}>critical mineral value chains</strong> across all stages—from advanced <strong style={{ color: "#f8fafc" }}>mineral exploration</strong> and <strong style={{ color: "#f8fafc" }}>domestic production</strong> to beneficiation, processing, and the <strong style={{ color: "#f8fafc" }}>recycling of critical minerals</strong> from end-of-life products. The mission actively pursues the <strong style={{ color: "#f8fafc" }}>overseas acquisition of critical mineral assets</strong> to mitigate supply chain vulnerabilities.
                </p>
                <p>
                  Through a holistic action plan encompassing policy reforms, financial support, extended producer responsibility frameworks, and <strong style={{ color: "#f8fafc" }}>technology development</strong>, the Government’s ultimate aim is to build a <strong style={{ color: "#f8fafc" }}>globally competitive and resilient critical mineral ecosystem</strong> for India.
                </p>
              </div>

              {/* Government Badge */}
              <div
                style={{
                  background: "rgba(5, 8, 17, 0.4)",
                  border: "1px solid rgba(99, 102, 241, 0.1)",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px"
                }}
              >
                <div style={{ fontSize: "2.5rem" }}>🇮🇳</div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#f8fafc",
                      fontSize: "1.1rem",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    National Critical Mineral Mission
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#818cf8",
                      fontFamily: "JetBrains Mono",
                      marginTop: "4px",
                    }}
                  >
                    Government of India
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INSPIRATIONS SECTION */}
        <section
          id="inspirations"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px",
            marginBottom: "60px",
          }}
        >
          <div className="glass-card" style={{ padding: "32px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🔒</div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#f8fafc",
                marginBottom: "12px",
              }}
            >
              Zero-Trust Architecture
            </h3>
            <p
              style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}
            >
              Inspired by the highest compliance levels in classified systems.
              We store authorization keys strictly in application memory,
              preventing persistence leakage, and enforce separate
              administrative boundaries for database oversight and text reading.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "32px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🛡️</div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#f8fafc",
                marginBottom: "12px",
              }}
            >
              Air-Gapped Privacy
            </h3>
            <p
              style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}
            >
              Modeled after isolated military networks. All intelligence
              compilation and embeddings are computed locally using local
              transformers and local CPU/GPU cycles, guaranteeing that sensitive
              national mineral assets are never leaked to commercial LLM clouds.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "32px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⚙️</div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#f8fafc",
                marginBottom: "12px",
              }}
            >
              Glass Bento UX
            </h3>
            <p
              style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}
            >
              Inspired by premium bento layouts. Renders dense operational
              information cleanly using glowing border glassmorphism, responsive
              elements, and clear typographic hierarchy for efficient monitoring
              and decision execution.
            </p>
          </div>
        </section>
      </main>

      {/* 1. FOOTER SECTION */}
      <footer
        style={{
          background: "rgba(5, 8, 17, 0.85)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(99, 102, 241, 0.1)",
          padding: "30px 40px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#f8fafc",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              NCMM Secure Intelligence Platform
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#475569",
                fontFamily: "JetBrains Mono",
              }}
            >
              Local Dev Edition v2.0.0 · Air-Gapped Scoping
            </span>
          </div>

          <div
            style={{
              fontSize: "0.9rem",
              color: "#94a3b8",
              fontFamily: "Outfit, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Made with{" "}
            <span
              style={{
                color: "#ef4444",
                animation: "fadeIn 1s infinite alternate",
              }}
            >
              ❤️
            </span>{" "}
            by <strong style={{ color: "#f8fafc" }}>Anand Raj</strong>
          </div>

          {/* Contact Details (Email, GitHub, LinkedIn) */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <a
              href="mailto:anand.ar1806@gmail.com"
              title="Send Email"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.85rem",
                color: "#94a3b8",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f8fafc";
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              anand.ar1806@gmail.com
            </a>

            <a
              href="https://github.com/anan5093"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub Profile"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.85rem",
                color: "#94a3b8",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              GitHub
            </a>

            <a
              href="https://www.linkedin.com/in/anand-raj-006a41217/"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn Profile"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.85rem",
                color: "#94a3b8",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
