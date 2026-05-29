import { Footer } from "../components/Footer";

export default function ForbiddenPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-start",
        background: "#0a0e1a",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ fontSize: "3rem" }}>🚫</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ef4444" }}>
          Access Denied
        </h1>
        <p style={{ color: "#94a3b8" }}>
          Your role does not permit access to this resource.
        </p>
        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
          Contact your system administrator if you believe this is in error.
        </p>
      </div>
      <Footer />
    </div>
  );
}
