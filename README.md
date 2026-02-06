# Google Workspace Automation Toolkit

This project is a full automation suite designed to manage users in Google Workspace. It includes scripts for creating, deleting, and configuring accounts using Node.js and Python.

**NEW**: Now supports database-based credential management for handling multiple G Suite accounts with geographical data. See [Database Documentation](docs/DATABASE.md) for details.

---

## Project Structure

```bash
.
├── files/
│   ├── arcore_01.csv
│   ├── data.csv
│   ├── html.txt
│   ├── info.csv
│   ├── names.csv
│   ├── user_list.csv
│   └── users.csv
├── main/
│   ├── package.json
│   └── api/
│       ├── bounce.js
│       ├── create.js
│       ├── delete.js
│       ├── email_logs.txt
│       ├── generate.js
│       ├── sendApi.js
│       └── smtp.js
├── py/
│   ├── activateLessSecureApp.py
│   ├── checkSmtp.py
│   ├── chunk.py
│   ├── duplicate.py
│   ├── filterProssesdEmail.py
│   ├── requirement.txt
│   ├── send.py
│   └── split.py
└── script.sh

---

## ⚙️ Setup Instructions

### 1. Install Dependencies

**Backend (Node.js)**
```bash
cd main/api
npm install
```

**Frontend (Node.js)**
```bash
cd frontend
npm install
```

**Python Scripts (Optional)**
```bash
pip install -r py/requirement.txt
```

### 2. Database Setup

The system uses SQLite for storing configurations, credentials, and G Suite accounts.

**Initialize Database:**
```bash
cd main/api
node -e "require('./db').getDatabase()"
```

This will create the database at `main/api/data/gadmin.db` with the required schema.

### 3. Google API Credentials

#### Option A: File-based (Traditional)
Add your Google API credentials:
- Place your `cred.json` file in the `main/api/` directory.
- Configure `.env` with your settings

#### Option B: Database-based (Recommended for multiple accounts)
1. Initialize the database (see step 2 above)

2. Migrate existing credentials:
```bash
cd main/api
node db/migrate.js migrate
```

3. Or add credentials via the API or web UI

**Database Features:**
- ✅ Manage multiple Google Service Account credentials
- ✅ Store G Suite accounts with geographical data
- ✅ Dynamic configuration management
- ✅ API endpoints for CRUD operations
- ✅ Support for credential rotation
- ✅ Geographic-based account selection

### 4. Configure Environment

Create or update `main/api/.env`:
```bash
# Server
PORT=3000

# Google Admin / service account (fallback if database not used)
ADMIN_EMAIL=admin@example.com
CRED_PATH=./cred.json
DEFAULT_DOMAIN=example.com

# API Authentication
API_KEY=your-secure-api-key-here

# Database mode (set to 'true' to use database)
USE_DATABASE=true
```

### 5. Start the Application

**Using Docker (Recommended):**
```bash
# Build and start all services
./run.sh up

# Or use docker-compose directly
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3001/api

**Without Docker:**

Backend:
```bash
cd main/api
npm start
```

Frontend (development):
```bash
cd frontend
npm run dev
```

Frontend (production build):
```bash
cd frontend
npm run build
npm run preview
```

---

🚀 Usage

1. Run All Scripts (Recommended)

Use the automated script.sh to:
	•	Delete existing users.
	•	Generate new user data.
	•	Create users in Google Workspace.
	•	Activate less secure app access.

bash script.sh

2. Run Scripts Individually

Generate User Data

node main/api/generate.js

Create Users

node main/api/create.js

Delete Users

node main/api/delete.js

Activate Less Secure App Access

python py/activateLessSecureApp.py



⸻

🛠 Configuration
	•	Update CSV files in the files/ directory:
(data.csv, info.csv, names.csv, users.csv, etc.)
	•	Modify constants like emailsPerWorker and REQUESTS_PER_EMAIL inside the scripts if needed.

⸻

📄 License

This project is licensed under the MIT License.
See the LICENSE file for more information.

⸻

🤝 Contributing

Contributions are welcome!
Please submit a pull request or open an issue for enhancements or bug fixes.

---

## Docker (Frontend + API)

The repository includes a `docker-compose.yml` that launches:
- **API** (Express) on `http://localhost:3001/api`
- **Frontend** (React + Vite + Nginx) on `http://localhost:3000`

### Commands

- Build images:
  ```bash
  ./run.sh build
  ```
- Start services:
  ```bash
  ./run.sh up
  ```
- Stop services:
  ```bash
  ./run.sh down
  ```

### Configuration

#### VITE_API_BASE_URL

The frontend is compiled (Vite) at Docker build time. To change the API URL:
```bash
VITE_API_BASE_URL=http://localhost:3001/api ./run.sh build
```

By default, `docker-compose.yml` uses `http://localhost:3001/api`.

#### API Key (Frontend)

The API key is sent in the `x-api-key` header.
- Configure it in the UI via the **Settings** page (stored in `localStorage`)
- The field is masked (`type=password`) and the key is not logged to console

### Frontend Features

**Dashboard:**
- System overview with statistics
- Geographical distribution of accounts
- Domain distribution

**Credentials Management:**
- Add, view, and manage Google Service Account credentials
- Activate/deactivate credentials
- Secure storage in database

**G Suite Accounts:**
- Add and manage G Suite accounts with geographical data
- Filter accounts by country
- Associate accounts with credentials
- Configure quota limits and request rates per account

**Settings:**
- Configure API key
- View system configuration
- Health check status

