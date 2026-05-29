const mongoose = require("mongoose");

async function debugDatabase() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/ncmm";
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB\n");

    // Define schemas
    const documentSchema = new mongoose.Schema(
      {},
      { collection: "documents", strict: false },
    );
    const chunkSchema = new mongoose.Schema(
      {},
      { collection: "chunks", strict: false },
    );
    const policySchema = new mongoose.Schema(
      {},
      { collection: "abac_policies", strict: false },
    );

    const Document = mongoose.model("Document", documentSchema);
    const Chunk = mongoose.model("Chunk", chunkSchema);
    const Policy = mongoose.model("AbacPolicy", policySchema);

    // Check document count
    const docCount = await Document.countDocuments();
    console.log(`📄 Documents: ${docCount}`);

    // Show first few documents
    const docs = await Document.find({}).limit(3).lean();
    console.log("Sample documents:");
    docs.forEach((doc) => {
      console.log(
        `  - ${doc.document_id} (CL${doc.clearance_level}, ${doc.department})`,
      );
    });

    // Check chunk count
    const chunkCount = await Chunk.countDocuments();
    console.log(`\n🧩 Total Chunks: ${chunkCount}`);

    const childChunks = await Chunk.countDocuments({ chunk_type: "child" });
    console.log(`   Child chunks: ${childChunks}`);
    const parentChunks = await Chunk.countDocuments({ chunk_type: "parent" });
    console.log(`   Parent chunks: ${parentChunks}`);

    // Show sample chunks with text preview
    console.log("\n📝 Sample child chunks:");
    const sampleChunks = await Chunk.find({ chunk_type: "child" })
      .limit(3)
      .lean();
    sampleChunks.forEach((chunk) => {
      console.log(
        `  - ${chunk.chunk_id}: ${chunk.chunk_text.substring(0, 60)}...`,
      );
    });

    // Check ABAC policies
    const policyCount = await Policy.countDocuments();
    console.log(`\n🔐 ABAC Policies: ${policyCount}`);

    const users = await Policy.find(
      {},
      { username: 1, role: 1, clearance_level: 1, department: 1 },
    ).lean();
    console.log("Users:");
    users.forEach((user) => {
      console.log(
        `  - ${user.username} (${user.role}, CL${user.clearance_level}, ${user.department})`,
      );
    });

    // Check vector hashes
    console.log("\n🔢 Chunks with vectors:");
    const withVectors = await Chunk.countDocuments({
      vector_hash: { $ne: null },
    });
    const withoutVectors = await Chunk.countDocuments({ vector_hash: null });
    console.log(`  - With vector_hash: ${withVectors}`);
    console.log(`  - Without vector_hash: ${withoutVectors}`);

    await mongoose.disconnect();
    console.log("\n✅ Database debug complete");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

debugDatabase();
