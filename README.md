# Google Workspace Automation Toolkit

A modern, secure **web application** for managing Google Workspace users with a REST API backend and React frontend.

> ⚠️ **Version 2.0 - Now with Web Interface!** This toolkit has been transformed from CLI-based scripts into a full-featured web application. The legacy CLI scripts are still available in the `main/` and `py/` directories for backward compatibility.

## ✨ New Features

- 🌐 **Web-based Admin Dashboard** - Intuitive React UI for user management
- 🔐 **Secure REST API** - JWT authentication and rate limiting
- 📊 **Real-time Operations** - Live feedback on bulk operations
- 📁 **CSV Upload** - Bulk user creation from CSV files
- 🎲 **User Generation** - Create test users with random data
- 🛡️ **Enterprise Security** - Input validation, CORS, and security headers
- ✉️ **Email Sending** - Integrated SendAPI and SMTP email functionality
- 🐍 **Python Integration** - Execute Python email scripts from web interface

## 🚀 Quick Start

### For Web Application (Recommended)

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure Google Workspace credentials
# See QUICKSTART.md for detailed setup

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev

# Access at http://localhost:3000
# Default login: admin / admin123
```

📖 **See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions**  
📚 **See [README_NEW.md](README_NEW.md) for complete documentation**  
📧 **See [EMAIL_FEATURE.md](EMAIL_FEATURE.md) for email sending documentation**

---

## 🎯 Legacy CLI Scripts (Deprecated)

This project originally included CLI-based scripts for managing users in Google Workspace using Node.js and Python. These scripts are still available but are no longer the recommended approach.

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

Python

pip install -r py/requirement.txt

2. Google API Credentials

Add your Google API credentials:
	•	Place your cred.json file in the main/api/ directory.

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

## 📧 Email Sending Features

The toolkit now includes integrated email sending functionality in the web interface:

### Features
- **Single Email**: Send individual emails via Google API or SMTP
- **Bulk Email**: Send emails to multiple recipients with automatic distribution
- **Python Script**: Execute the legacy Python email script from the web UI
- **CSV Upload**: Upload sender accounts and recipient lists via CSV
- **Rate Limiting**: Automatic rate limiting to prevent quota exhaustion

### Usage
1. Log in to the web application
2. Navigate to "Email Sending" in the navigation bar
3. Choose your sending method:
   - **Single Email**: For individual test sends
   - **Bulk Email**: For mass email campaigns
   - **Python Script**: For legacy script execution

### Supported Methods
- **Google API (SendAPI)**: Uses Google Workspace API (300 emails per account)
- **SMTP**: Direct SMTP connection via nodemailer (20 emails per account)

For detailed documentation, see [EMAIL_FEATURE.md](EMAIL_FEATURE.md).



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
