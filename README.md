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

**Node.js**
```bash
cd main/api
npm install
```

**Python**
```bash
pip install -r py/requirement.txt
```

### 2. Google API Credentials

#### Option A: File-based (Traditional)
Add your Google API credentials:
- Place your `cred.json` file in the `main/api/` directory.
- Configure `.env` with your settings

#### Option B: Database-based (Recommended for multiple accounts)
1. Initialize the database:
```bash
cd main/api
node db/migrate.js migrate
```

2. Import credentials via API or migration script
3. See [Database Documentation](docs/DATABASE.md) for complete setup guide

**Database Features:**
- ✅ Manage multiple Google Service Account credentials
- ✅ Store G Suite accounts with geographical data
- ✅ Dynamic configuration management
- ✅ API endpoints for CRUD operations
- ✅ Support for credential rotation

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

## Docker (frontend + API)

Le repo inclut un `docker-compose.yml` qui lance :
- **API** (Express) sur `http://localhost:3001/api`
- **Frontend** (Vite build + Nginx) sur `http://localhost:3000`

### Commandes

- Build images :
	- `./run.sh build`
- Démarrer :
	- `./run.sh up`
- Stopper :
	- `./run.sh down`

### Configuration `VITE_API_BASE_URL`

Le frontend est compilé (Vite) **au build Docker**. Pour changer l’URL de l’API :
- `VITE_API_BASE_URL=http://localhost:3001/api ./run.sh build`

Par défaut, `docker-compose.yml` utilise `http://localhost:3001/api`.

### API Key (frontend)

La clé API est envoyée dans le header `x-api-key`.
- Elle se configure dans l’UI via la page **Settings** (stockage `localStorage`).
- Le champ est masqué (`type=password`) et la clé n’est pas loggée en console.

⸻
