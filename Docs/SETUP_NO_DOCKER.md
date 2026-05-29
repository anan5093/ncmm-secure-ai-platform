# 🚀 Running NCMM Platform Natively Without Docker (Low RAM Guide)

Since your machine has 8GB RAM, **running Docker Desktop + WSL2 is highly discouraged** as it typically consumes 2GB to 3GB of RAM just staying idle.

By running **MongoDB in the cloud (Free Atlas)** and **OPA as a native Windows binary**, you will use **almost 0% extra RAM** for infrastructure.

---

## Part 1: Running Open Policy Agent (OPA) Natively

OPA is a single Go compiled binary. It is extremely lightweight (~50MB) and uses less than 20MB of RAM when running.

1. **Download OPA for Windows**:
   - Download the latest `opa_windows_amd64.exe` from the official repository:
     👉 [https://openpolicyagent.org/downloads/latest/opa_windows_amd64.exe](https://openpolicyagent.org/downloads/latest/opa_windows_amd64.exe)
   - *Alternative download link (GitHub)*: [https://github.com/open-policy-agent/opa/releases](https://github.com/open-policy-agent/opa/releases)

2. **Place and Rename**:
   - Copy the downloaded file into your project folder: `e:\Secure rag\ncmm-intel-platform\`
   - Rename the file from `opa_windows_amd64.exe` to simply **`opa.exe`**.

3. **Run OPA**:
   - Open a terminal in VS Code and run:
     ```powershell
     cd "e:\Secure rag\ncmm-intel-platform"
     .\opa.exe run --server --addr=localhost:8181 .\policies
     ```
   - Keep this terminal open. OPA is now running locally on port 8181 using virtually no RAM!

---

## Part 2: Running MongoDB (Choose Option A or B)

### Option A: Use MongoDB Atlas (Cloud) — Recommended (0% Local RAM!)

This completely offloads the database to the cloud. It is 100% free and takes 0MB of RAM on your laptop.

1. **Create a Free Account**:
   - Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. **Deploy a Free Cluster**:
   - Create a new database deployment, select **M0 (Free)**, and choose any cloud region (e.g., AWS / Mumbai).
3. **Database Access (User)**:
   - In the security quick-start, create a database user (e.g., username `ncmm-dev` and password `some-strong-pass`).
4. **Network Access (IP)**:
   - Add IP address `0.0.0.0/30` (Allow access from anywhere) so you can connect from home, or add your current IP.
5. **Get Connection String**:
   - Click **Connect** → **Drivers** → Copy the connection string. It will look like:
     `mongodb+srv://ncmm-dev:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
6. **Update your `.env`**:
   - Open `e:\Secure rag\ncmm-intel-platform\.env` in VS Code and replace the local MongoDB URI with your Atlas string:
     ```env
     MONGODB_URI=mongodb+srv://ncmm-dev:your-actual-password@cluster0.xxxxx.mongodb.net/ncmm?retryWrites=true&w=majority
     ```
   - (Note: We added `/ncmm` before the `?` to specify the database name).

---

### Option B: Install MongoDB Natively on Windows (~100MB Local RAM)

If you prefer to keep everything local, you can install MongoDB natively. It runs as a lightweight Windows service and uses much less RAM than Docker.

1. **Download MongoDB Community Server**:
   - Download the Windows MSI installer from:
     👉 [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. **Install**:
   - Run the MSI installer.
   - Choose **"Complete"** installation.
   - Ensure the checkbox **"Run service as Network Service user"** is checked (this installs it as a background Windows Service that starts automatically).
   - Click Next and install.
3. **Verify Local MongoDB**:
   - It automatically starts on port `27017`. Your `.env` default is already set to connect to this:
     ```env
     MONGODB_URI=mongodb://localhost:27017
     ```

---

## Part 3: Running the Application Now

Once OPA is running in one terminal (Part 1) and MongoDB is active (either Atlas or Native Service in Part 2), run the initialization scripts:

Open a new terminal in VS Code:
```powershell
cd "e:\Secure rag\ncmm-intel-platform"

# 1. Initialize indexes and seed users
node scripts/setup/init_db_indexes.js
node scripts/seed/seed_abac_policies.js

# 2. Ingest the 20 documents
node scripts/seed/run_seed_ingestion.js

# 3. Start the application servers
# Terminal A (Express API):
cd backend
node src/server.js

# Terminal B (Mock LLM):
cd backend
npm run mock-llm

# Terminal C (React Frontend):
cd frontend
npm run dev
```
