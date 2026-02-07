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

⸻
