# Google Workspace Automation Toolkit

This project is a full automation suite designed to manage users in Google Workspace. It includes scripts for creating, deleting, and configuring accounts using Node.js and Python.

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

**Node.js**
```bash
cd main
npm install

Database

Create schema and import data (see one-liner below) after setting env vars.

Python

pip install -r py/requirement.txt

2. Google API Credentials

Add your Google API credentials:
	•	Store the JSON as base64 in `GOOGLE_CRED_JSON_B64`.
	•	Optional: set `KMS_KEY_ID` to decrypt via Google KMS at runtime.

⸻

Database Setup (PostgreSQL)

Required env vars:
`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSSL`

Optional env vars:
`GOOGLE_CRED_JSON_B64`, `KMS_KEY_ID`

One-liner (schema + import):
```bash
psql "$PGDATABASE" -f main/api/db/schema.sql && node main/api/db/import.js
```

⸻

## 🚀 Usage

### Option 1: REST API Server (Recommended)

Start the API server to manage all database entities via REST endpoints:

```bash
cd main/api
node server.js
```

The API will be available at `http://localhost:3000` (or custom PORT env var).

#### API Endpoints

**Users** (`/api/users`)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

**Email Data** (`/api/email-data`)
- `GET /api/email-data` - Get all email data
- `GET /api/email-data/:id` - Get email data by ID
- `POST /api/email-data` - Create new email data
- `PUT /api/email-data/:id` - Update email data
- `DELETE /api/email-data/:id` - Delete email data

**Email Info** (`/api/email-info`)
- `GET /api/email-info` - Get all email info
- `GET /api/email-info/active` - Get active email info
- `GET /api/email-info/:id` - Get email info by ID
- `POST /api/email-info` - Create new email info
- `PUT /api/email-info/:id` - Update email info
- `DELETE /api/email-info/:id` - Delete email info

**Email Templates** (`/api/email-templates`)
- `GET /api/email-templates` - Get all templates
- `GET /api/email-templates/active` - Get active template
- `GET /api/email-templates/:id` - Get template by ID
- `POST /api/email-templates` - Create new template
- `PUT /api/email-templates/:id` - Update template
- `DELETE /api/email-templates/:id` - Delete template

**Names** (`/api/names`)
- `GET /api/names` - Get all names
- `GET /api/names/:id` - Get name by ID
- `POST /api/names` - Create new name
- `PUT /api/names/:id` - Update name
- `DELETE /api/names/:id` - Delete name

**Email Logs** (`/api/email-logs`) - Read-only
- `GET /api/email-logs` - Get all logs (supports filtering: `?user_email=`, `?status=`, `?provider=`)
- `GET /api/email-logs/:id` - Get log by ID
- `GET /api/email-logs/stats/summary` - Get email statistics

**Bounce Logs** (`/api/bounce-logs`) - Read-only
- `GET /api/bounce-logs` - Get all bounce logs (supports filtering: `?email=`)
- `GET /api/bounce-logs/:id` - Get bounce log by ID
- `GET /api/bounce-logs/stats/summary` - Get bounce statistics

### Option 2: Run All Scripts

Use the automated script.sh to:
- Delete existing users
- Generate new user data
- Create users in Google Workspace
- Activate less secure app access

```bash
bash script.sh
```

### Option 3: Run Scripts Individually

**Generate User Data**
```bash
node main/api/generate.js
```

**Create Users**
```bash
node main/api/create.js
```

**Delete Users**
```bash
node main/api/delete.js
```

**Activate Less Secure App Access**
```bash
python py/activateLessSecureApp.py
```

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

⸻
