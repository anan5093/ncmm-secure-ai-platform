/**
 * Test MongoDB Atlas Connection
 * Run: node scripts/dev/test_atlas_connection.js
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

async function testConnection() {
  console.log("\n═══ MongoDB Atlas Connection Test ═══\n");
  console.log(
    "MONGODB_URI:",
    process.env.MONGODB_URI?.substring(0, 50) + "...",
  );

  try {
    console.log("\n[1] Testing connection with extended timeouts...");
    const startTime = Date.now();

    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017",
      {
        dbName: "ncmm_intel",
        serverSelectionTimeoutMS: 60000, // 60 seconds
        socketTimeoutMS: 60000, // 60 seconds
        maxPoolSize: 5,
        retryWrites: true,
        w: "majority",
      },
    );

    const connectTime = Date.now() - startTime;
    console.log(`✅ Connection successful (${connectTime}ms)`);

    // Test 1: Ping
    console.log("\n[2] Testing ping...");
    const pingStart = Date.now();
    await mongoose.connection.db.admin().ping();
    console.log(`✅ Ping successful (${Date.now() - pingStart}ms)`);

    // Test 2: List collections
    console.log("\n[3] Listing collections...");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      `✅ Found ${collections.length} collections:`,
      collections.map((c) => c.name).join(", "),
    );

    // Test 3: Count documents
    console.log("\n[4] Testing document count...");
    const docStart = Date.now();
    const docCount = await mongoose.connection.db
      .collection("documents")
      .countDocuments();
    console.log(`✅ Documents count: ${docCount} (${Date.now() - docStart}ms)`);

    // Test 4: Insert test document
    console.log("\n[5] Testing insert operation...");
    const insertStart = Date.now();
    const result = await mongoose.connection.db
      .collection("test_connection")
      .insertOne({
        test: true,
        timestamp: new Date(),
        testId: "atlas-connectivity-check",
      });
    console.log(
      `✅ Insert successful - ID: ${result.insertedId} (${Date.now() - insertStart}ms)`,
    );

    // Test 5: Query test document
    console.log("\n[6] Testing query operation...");
    const queryStart = Date.now();
    const doc = await mongoose.connection.db
      .collection("test_connection")
      .findOne({ testId: "atlas-connectivity-check" });
    console.log(
      `✅ Query successful (${Date.now() - queryStart}ms)`,
      doc?.test ? "- Document found!" : "",
    );

    // Cleanup
    await mongoose.connection.db
      .collection("test_connection")
      .deleteOne({ testId: "atlas-connectivity-check" });

    console.log("\n═══ All Tests Passed! ═══\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Connection failed:");
    console.error("Error:", err.message);
    console.error("\nPossible issues:");
    console.error(
      "1. IP address not whitelisted in MongoDB Atlas Security Groups",
    );
    console.error("2. Incorrect credentials in MONGODB_URI");
    console.error("3. Network connectivity issues");
    console.error("4. Database or cluster offline");
    console.error("\nTo fix:");
    console.error("1. Add your IP to MongoDB Atlas Security → Network Access");
    console.error("2. Verify MONGODB_URI in .env file");
    console.error("3. Check your internet connection");
    process.exit(1);
  }
}

testConnection();
