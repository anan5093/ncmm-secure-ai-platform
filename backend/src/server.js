/**
 * Express Server — NCMM Secure Intelligence Platform
 * Local Dev Edition: no nginx, no PM2, run directly with: node src/server.js
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const authRouter = require("./routes/auth");
const queryRouter = require("./routes/query");
const recordsRouter = require("./routes/records");
const adminRouter = require("./routes/admin");
const { authenticateJWT } = require("./middleware/auth");
const metrics = require("./telemetry/metrics");
const { loadIndex } = require("./search/faissManager");
const { buildIndex } = require("./search/bm25Manager");

const PORT = parseInt(process.env.PORT || "3000");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

// ── Security middleware ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  }),
);

app.use(
  cors({
    origin:
      NODE_ENV === "development"
        ? ["http://localhost:5173", "http://127.0.0.1:5173"]
        : false,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// Rate limiter — 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", code: "RATE_LIMIT_EXCEEDED" },
});
app.use("/api/", limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/query", queryRouter);
app.use("/api/v1/records", recordsRouter);
app.use("/api/admin", adminRouter);

// ── Health check (public) ─────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ncmm-intel-platform",
    version: "2.0.0-localdev",
    timestamp: new Date().toISOString(),
  });
});

// ── Prometheus metrics (localhost-only, no auth) ──────────────────────────────
app.get("/metrics", async (req, res) => {
  // Only allow from localhost — NFR-S enforcement
  const clientIp = req.ip || req.connection.remoteAddress || "";
  const isLocalhost = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].some((ip) =>
    clientIp.includes(ip),
  );

  if (!isLocalhost) {
    return res
      .status(403)
      .json({ error: "Metrics endpoint restricted to localhost" });
  }

  try {
    res.set("Content-Type", metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[SERVER] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║    NCMM Secure Intelligence Platform — Local Dev     ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // 1. Connect to MongoDB
  console.log("[SERVER] Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "ncmm_intel",
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: "majority",
    });
    console.log("[SERVER] ✅ MongoDB connected");

    // Register complete schemas immediately to prevent missing/partial schema errors
    require("./ingestion/pipeline").getModels();
  } catch (err) {
    console.error("[SERVER] ❌ MongoDB connection failed:", err.message);
    console.error("[SERVER] Ensure docker-compose up -d is running");
    process.exit(1);
  }

  // 2. Load FAISS index
  console.log("[SERVER] Loading FAISS index...");
  try {
    loadIndex();
    console.log("[SERVER] ✅ FAISS index loaded");
  } catch (err) {
    console.warn(
      "[SERVER] ⚠️  FAISS index load failed (expected if empty):",
      err.message,
    );
  }

  // 3. Build BM25 index from MongoDB
  console.log("[SERVER] Building BM25 index from MongoDB...");
  try {
    const { Chunk } = require("./ingestion/pipeline").getModels();

    const childChunks = await Chunk.find(
      { chunk_type: "child" },
      { chunk_id: 1, chunk_text: 1 },
    ).lean();
    buildIndex(childChunks);
    console.log(
      `[SERVER] ✅ BM25 index built with ${childChunks.length} chunks`,
    );
  } catch (err) {
    console.warn("[SERVER] ⚠️  BM25 index build failed:", err.message);
  }

  // 4. Start HTTP server
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`\n[SERVER] ✅ API running at http://127.0.0.1:${PORT}`);
    console.log(`[SERVER]    Health: http://127.0.0.1:${PORT}/health`);
    console.log(`[SERVER]    Metrics: http://127.0.0.1:${PORT}/metrics`);
    console.log(`[SERVER]    Env: ${NODE_ENV}`);
    console.log("\n[SERVER] Waiting for requests...\n");
  });
}

start();

module.exports = app; // for testing
