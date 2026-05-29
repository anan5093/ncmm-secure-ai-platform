export function Footer() {
  return (
    <footer
      style={{
        background: "rgba(5, 8, 17, 0.85)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(99, 102, 241, 0.1)",
        padding: "20px 40px",
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

        {/* Social Links */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <a
            href="mailto:anand.ar1806@gmail.com"
            title="Send Email"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
              color: "#94a3b8",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f8fafc";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
            }}
          >
            ✉️ anand.ar1806@gmail.com
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
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#6366f1";
              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
          >
            🐙 GitHub
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
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#3b82f6";
              e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
              e.currentTarget.style.background = "rgba(59, 130, 246, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
          >
            💼 LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
