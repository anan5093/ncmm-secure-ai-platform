# NCMM Secure Intelligence Platform — Quick Start Guide
# Run all these commands in VS Code Integrated Terminal (PowerShell)
# Working directory: e:\Secure rag\ncmm-intel-platform\

# STEP 1: Install backend dependencies
cd "e:\Secure rag\ncmm-intel-platform\backend"
npm install

# STEP 2: Install frontend dependencies
cd "e:\Secure rag\ncmm-intel-platform\frontend"
npm install

# STEP 3: Install root-level test dependencies
cd "e:\Secure rag\ncmm-intel-platform"
npm install

# STEP 4: Start Docker services (MongoDB + OPA)
docker-compose up -d

# STEP 5: Wait 10 seconds, then initialise DB indexes
Start-Sleep -Seconds 10
cd "e:\Secure rag\ncmm-intel-platform"
node scripts/setup/init_db_indexes.js

# STEP 6: Seed ABAC users
node scripts/seed/seed_abac_policies.js

# STEP 7: Run seed ingestion (20 documents)
node scripts/seed/run_seed_ingestion.js

# STEP 8: Verify DB health
node scripts/dev/check_db_health.js

# STEP 9: Verify FAISS index
node scripts/dev/verify_faiss_index.js
