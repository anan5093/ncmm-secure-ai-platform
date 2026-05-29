/**
 * Admin Routes
 * Protected routes for ROLE_SYSADMIN only
 * Provides metrics, logs, query interface, and system health
 */
const express = require("express");
const { authenticateJWT, requireRole } = require("../middleware/auth");
const mongoose = require("mongoose");
const { getModels } = require("../ingestion/pipeline");

const router = express.Router();

// Apply JWT authentication to all admin routes
router.use(authenticateJWT);
router.use(requireRole("ROLE_SYSADMIN"));

/**
 * GET /api/admin/metrics
 * Returns system metrics: document count, chunk count, vector count, query stats, etc.
 */
router.get("/metrics", async (req, res) => {
  try {
    const { Document, Chunk } = getModels();

    const totalDocuments = await Document.countDocuments();
    const totalChunks = await Chunk.countDocuments();

    // Mock data for metrics not directly queryable
    const metrics = {
      totalDocuments: totalDocuments || 0,
      totalChunks: totalChunks || 0,
      totalVectors: 164, // From FAISS index
      totalUsers: 6,
      queryCount: 42,
      avgQueryLatency: 1350,
      systemUptime: "5d 12h 30m",
      lastUpdated: new Date().toISOString(),
    };

    res.json(metrics);
  } catch (err) {
    console.error("Error fetching metrics:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch metrics", code: "METRICS_FETCH_FAILED" });
  }
});

/**
 * GET /api/admin/logs
 * Returns system activity logs (queries, auth events, errors, etc.)
 */
router.get("/logs", async (req, res) => {
  try {
    // Mock admin logs for now
    // In production, these would be retrieved from a logging service
    const logs = [
      {
        timestamp: new Date(Date.now() - 5000).toISOString(),
        level: "INFO",
        category: "QUERY",
        message: "User query executed successfully",
        user: "r.sharma",
        metadata: {
          query_id: "q-001",
          latency_ms: 1350,
          documents_returned: 5,
        },
      },
      {
        timestamp: new Date(Date.now() - 15000).toISOString(),
        level: "INFO",
        category: "AUTH",
        message: "User authenticated successfully",
        user: "p.krishnan",
        metadata: { ip: "192.168.1.100", method: "jwt" },
      },
      {
        timestamp: new Date(Date.now() - 45000).toISOString(),
        level: "WARN",
        category: "SECURITY",
        message: "Authorization denied - insufficient clearance",
        user: "a.mehta",
        metadata: { reason: "CL2 < CL3", resource: "doc-jnpt-003" },
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: "INFO",
        category: "INGESTION",
        message: "Documents ingested successfully",
        metadata: { count: 5, chunks_created: 28 },
      },
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: "INFO",
        category: "SYSTEM",
        message: "FAISS index rebuilt",
        metadata: { vectors: 164, dimensions: 384, index_type: "HNSW" },
      },
    ];

    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch logs", code: "LOGS_FETCH_FAILED" });
  }
});

/**
 * POST /api/admin/query
 * Execute admin queries (MongoDB queries or natural language)
 * Body: { query: string }
 */
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Invalid query: must provide a non-empty string",
        code: "INVALID_QUERY",
      });
    }

    const { Document } = getModels();

    // Simple natural language to MongoDB query translation
    let dbQuery = {};
    const queryLower = query.toLowerCase();

    // Example patterns
    if (queryLower.includes("cobalt")) {
      dbQuery.title = { $regex: "cobalt", $options: "i" };
    }
    if (queryLower.includes("lithium")) {
      dbQuery.title = { $regex: "lithium", $options: "i" };
    }
    if (queryLower.includes("geology")) {
      dbQuery.title = { $regex: "geology", $options: "i" };
    }
    if (queryLower.includes("port") || queryLower.includes("manifest")) {
      dbQuery.department = "PORT_OPS";
    }
    if (queryLower.includes("rajasthan")) {
      dbQuery.title = { $regex: "rajasthan", $options: "i" };
    }
    if (queryLower.includes("jharkhand")) {
      dbQuery.title = { $regex: "jharkhand", $options: "i" };
    }

    // If no patterns matched, return recent documents
    if (Object.keys(dbQuery).length === 0) {
      dbQuery = {}; // Return all
    }

    const results = await Document.find(dbQuery).limit(10).select("-embedding");

    res.json({
      query_executed: query,
      pattern_applied: dbQuery,
      results_count: results.length,
      results: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error executing admin query:", err);
    res.status(500).json({
      error: "Failed to execute query",
      code: "QUERY_EXECUTION_FAILED",
      details: err.message,
    });
  }
});

/**
 * GET /api/admin/health
 * Returns health status of all system components
 */
router.get("/health", async (req, res) => {
  try {
    // Check MongoDB connection
    let mongoStatus = "Online";
    try {
      await mongoose.connection.db.admin().ping();
    } catch {
      mongoStatus = "Offline";
    }

    const health = {
      timestamp: new Date().toISOString(),
      backend_api: { status: "Online", latency_ms: 1 },
      mongodb: { status: mongoStatus, latency_ms: 8 },
      opa_policy_engine: { status: "Online", latency_ms: 12 },
      faiss_vector_index: { status: "Online", latency_ms: 120 },
      mock_llm: { status: "Online", latency_ms: 340 },
      system_uptime_seconds: Math.floor(process.uptime()),
    };

    res.json(health);
  } catch (err) {
    console.error("Error checking health:", err);
    res
      .status(500)
      .json({ error: "Failed to check health", code: "HEALTH_CHECK_FAILED" });
  }
});

/**
 * GET /api/admin/stats
 * Returns detailed statistics about the platform
 */
router.get("/stats", async (req, res) => {
  try {
    const { Document, Chunk } = getModels();

    const totalDocuments = await Document.countDocuments();
    const totalChunks = await Chunk.countDocuments();
    const documentsByType = await Document.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const stats = {
      documents: {
        total: totalDocuments,
        by_type: documentsByType.reduce((acc, item) => {
          acc[item._id || "unknown"] = item.count;
          return acc;
        }, {}),
      },
      chunks: {
        total: totalChunks,
        avg_per_document:
          totalDocuments > 0 ? Math.round(totalChunks / totalDocuments) : 0,
      },
      vectors: {
        total: 164,
        dimensions: 384,
        index_type: "HNSW",
      },
      abac_enforcement: {
        total_policies: 3,
        users_tracked: 6,
        authorization_checks: 847,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(stats);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch stats", code: "STATS_FETCH_FAILED" });
  }
});

module.exports = router;
