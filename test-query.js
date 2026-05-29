const http = require("http");

function makeRequest(method, path, body) {
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

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testQuery() {
  try {
    console.log("🔐 Step 1: Login with test user...\n");
    const loginRes = await makeRequest("POST", "/api/v1/auth/login", {
      username: "r.sharma",
      password: "vizag-inspector-pass-2025",
    });

    if (loginRes.status !== 200) {
      console.error("❌ Login failed:", loginRes.status, loginRes.body);
      return;
    }

    const loginData = JSON.parse(loginRes.body);
    const token = loginData.token;
    console.log("✅ Login successful!");
    console.log("   Token:", token.substring(0, 50) + "...\n");

    console.log("📤 Step 2: Sending query...\n");
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/query",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    const queryRes = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode, body: data });
        });
      });
      req.on("error", reject);
      req.write(JSON.stringify({ query: "cobalt supply chain", limit: 5 }));
      req.end();
    });

    if (queryRes.status !== 200) {
      console.error("❌ Query failed:", queryRes.status, queryRes.body);
      return;
    }

    const queryData = JSON.parse(queryRes.body);
    console.log("✅ Query executed successfully!\n");
    console.log("═══════════════════════════════════════════");
    console.log("📋 QUERY RESULTS");
    console.log("═══════════════════════════════════════════\n");
    console.log(JSON.stringify(queryData, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testQuery();
