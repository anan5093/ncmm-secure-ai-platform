const http = require("http");

function makeRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testQueries() {
  try {
    // Login with r.sharma (PORT_INSPECTOR, CL2)
    console.log("🔐 Logging in as r.sharma (PORT_INSPECTOR, CL2)...\n");
    let loginRes = await makeRequest("POST", "/api/v1/auth/login", {
      username: "r.sharma",
      password: "vizag-inspector-pass-2025",
    });

    if (loginRes.status !== 200) {
      console.error("❌ Login failed:", loginRes.body);
      return;
    }

    let token = JSON.parse(loginRes.body).token;
    console.log("✅ Login successful!\n");

    // Test Query 1 - Generic search
    console.log("═══════════════════════════════════════════");
    console.log('🔍 Query 1: "cobalt supply chain"');
    console.log("═══════════════════════════════════════════\n");

    let queryRes = await makeRequest(
      "POST",
      "/api/v1/query",
      {
        query: "cobalt supply chain",
        limit: 5,
      },
      token,
    );

    let result = JSON.parse(queryRes.body);
    console.log("Response:", result.response_text);
    console.log("Citations found:", result.citations.length);
    console.log("Latency:", result.query_latency_ms + "ms\n");

    // Test Query 2 - Different search term
    console.log("═══════════════════════════════════════════");
    console.log('🔍 Query 2: "mineral stockpile"');
    console.log("═══════════════════════════════════════════\n");

    queryRes = await makeRequest(
      "POST",
      "/api/v1/query",
      {
        query: "mineral stockpile",
        limit: 5,
      },
      token,
    );

    result = JSON.parse(queryRes.body);
    console.log("Response:", result.response_text);
    console.log("Citations found:", result.citations.length);
    console.log("Latency:", result.query_latency_ms + "ms\n");

    // Test Query 3 - Mission director (higher clearance)
    console.log("═══════════════════════════════════════════");
    console.log("🔐 Logging in as s.iyer (MISSION_DIRECTOR, CL5)...\n");

    loginRes = await makeRequest("POST", "/api/v1/auth/login", {
      username: "s.iyer",
      password: "mission-director-pass-2025",
    });

    if (loginRes.status !== 200) {
      console.error("❌ Login failed:", loginRes.body);
      return;
    }

    token = JSON.parse(loginRes.body).token;
    console.log("✅ Login successful!\n");

    console.log("═══════════════════════════════════════════");
    console.log('🔍 Query 3: "mineral supply" (as Mission Director)');
    console.log("═══════════════════════════════════════════\n");

    queryRes = await makeRequest(
      "POST",
      "/api/v1/query",
      {
        query: "mineral supply",
        limit: 5,
      },
      token,
    );

    result = JSON.parse(queryRes.body);
    console.log("Response:", result.response_text);
    console.log("Citations found:", result.citations.length);
    if (result.citations && result.citations.length > 0) {
      console.log("\n📚 First citation details:");
      console.log("  - Document ID:", result.citations[0].document_id);
      console.log("  - Chunk ID:", result.citations[0].chunk_id);
      console.log(
        "  - Text preview:",
        result.citations[0].chunk_text?.substring(0, 100) + "...",
      );
    }
    console.log("Latency:", result.query_latency_ms + "ms\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testQueries();
