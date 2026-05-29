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
    // Login
    console.log("🔐 Logging in as r.sharma...\n");
    let loginRes = await makeRequest("POST", "/api/v1/auth/login", {
      username: "r.sharma",
      password: "vizag-inspector-pass-2025",
    });

    let token = JSON.parse(loginRes.body).token;
    console.log("✅ Login successful!\n");

    console.log("═══════════════════════════════════════════");
    console.log('🔍 Query: "cobalt supply chain"');
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

    console.log("Status:", queryRes.status);
    console.log("\n📋 Full Response:");
    console.log(queryRes.body);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testQueries();
