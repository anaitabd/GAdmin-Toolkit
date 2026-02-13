# Google Workspace Automation Toolkit

This project is a full automation suite designed to manage users in Google Workspace (G Suite). It includes scripts for creating, deleting, and configuring accounts using Node.js and Python, plus a comprehensive REST API for database management and email campaign orchestration.

---

## ✨ Features

### Core Features
- **REST API** - Complete CRUD operations for all database entities
- **Google Workspace Integration** - Automated user creation and management with validation
- **Email Automation** - Bulk email sending with Gmail API and SMTP support
- **Campaign Management** - Create, track, and manage email campaigns with pause/resume/kill controls
- **Click Tracking** - Track email link clicks with unique tracking IDs
- **Standalone Tracking Links** - Create and manage tracking links for any URL with HTML snippet generation
- **Campaign Analytics** - Real-time campaign statistics (sent, failed, clicks, CTR)
- **Campaign Templates** - Save and reuse campaign configurations
- **Database Management** - PostgreSQL backend with comprehensive schema

### G Suite Management Features
- **User Creation** - Batch create Google Workspace users with validation
  - Email format validation
  - Password strength requirements (min 8 characters)
  - Duplicate email detection
  - Comprehensive error handling and logging
  
- **User Deletion** - Safely delete users from Google Workspace
  - Admin account protection
  - Batch processing with rate limiting
  - Progress tracking
  
- **Bounce Detection** - Automated bounce email detection
  - Scans Mail Delivery Subsystem messages
  - Extracts bounced email addresses
  - Stores bounce logs in database
  
- **User Generation** - Generate random test users
  - Uses name database for realistic data
  - Domain-specific email generation
  - Configurable batch sizes
  
- **SMTP Integration** - Direct SMTP email sending
  - Nodemailer integration
  - Rate limiting and quota management
  - Email placeholder support
  
- **Gmail API Integration** - Advanced email sending via Gmail API
  - OAuth 2.0 JWT authentication
  - Better deliverability
  - Enhanced tracking capabilities

---

## 📚 Documentation

### Essential Documentation
- **[COMPREHENSIVE CODEBASE ANALYSIS](COMPREHENSIVE_CODEBASE_ANALYSIS.md)** - **⭐ Complete 75KB guide covering everything you need to know**
  - Project overview and architecture
  - File-by-file analysis (all 192 code files)
  - Data flow diagrams and API documentation
  - Complete feature list and functionality
  - Step-by-step rebuild instructions
  - Security and performance assessment

### Quick Start Guides
- **[Quick Start Guide](main/api/QUICKSTART.md)** - Get started in 5 minutes
- **[API Documentation](main/api/API_DOCUMENTATION.md)** - Complete API reference
- **[Email Testing Guide](docs/EMAIL_TESTING_GUIDE.md)** - Test email delivery and verify inbox placement

### Feature-Specific Guides
- **[Tracking Links Quickstart](docs/TRACKING_LINKS_QUICKSTART.md)** - Get started with tracking links in 5 minutes
- **[Tracking Links Guide](docs/TRACKING_LINKS.md)** - Complete tracking links API reference
- **[Email Platforms Guide](docs/EMAIL_PLATFORMS.md)** - Best email sending platforms and recommendations
- **[Scaling Guide](docs/SCALING_GUIDE.md)** - How to scale your application

### Testing
- **[Test Script](main/api/test-api.sh)** - Test all API endpoints

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

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Google Cloud Platform account with Workspace API enabled
- Python 3.8+ (for utilities)

### 1. Install Dependencies

**Node.js Backend**
```bash
cd main
npm install
```

**Frontend (React + TypeScript)**
```bash
cd frontend
npm install
```

**Database**

Create schema and import data after setting environment variables.

**Python Utilities**
```bash
pip install -r py/requirement.txt
```

### 2. Google API Credentials

To use G Suite management features, you need proper Google API credentials:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Required APIs**
   - Enable Google Workspace Admin SDK API
   - Enable Gmail API

3. **Create Service Account**
   - Navigate to IAM & Admin → Service Accounts
   - Create a new service account with domain-wide delegation
   - Download the JSON key file

4. **Configure Domain-Wide Delegation**
   - In Google Workspace Admin console
   - Go to Security → API Controls → Domain-wide Delegation
   - Add your service account with required scopes:
     - `https://www.googleapis.com/auth/admin.directory.user`
     - `https://mail.google.com/`

5. **Store Credentials**
   - Encode your JSON key as base64: `cat service-account.json | base64`
   - Set environment variable `GOOGLE_CRED_JSON_B64` with the base64 string
   - Optional: Use `KMS_KEY_ID` for encrypted credentials with Google KMS

**Example:**
```bash
export GOOGLE_CRED_JSON_B64="eyJjbGllbnRfZW1haWwiOiJ5b3VyLXNlcnZpY2UtYWNjb3VudEBwcm9qZWN0LmlhbS5nc2VydmljZWFjY291bnQuY29tIiw..."
```

---

### 3. Database Setup (PostgreSQL)

**Required Environment Variables:**
```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=gadmin
export PGUSER=postgres
export PGPASSWORD=your_password
export PGSSL=false  # Set to true for production
```

**Optional Environment Variables:**
```bash
export GOOGLE_CRED_JSON_B64="<base64-encoded-credentials>"
export KMS_KEY_ID="projects/your-project/locations/global/keyRings/your-ring/cryptoKeys/your-key"
export PORT=3000  # API server port
export JWT_SECRET="your-secret-key"  # For authentication
```

**Initialize Database:**
```bash
# Note: Ensure environment variables (PGDATABASE, PGHOST, etc.) are set first
# You can verify with: echo $PGDATABASE

# Create database schema
psql "$PGDATABASE" -f main/api/db/schema.sql

# Import sample data (optional)
node main/api/db/import.js
```

---

## 🚀 Usage

### Option 1: Full Stack Development (Recommended)

Start both backend API and frontend development servers:

**Terminal 1 - Backend API:**
```bash
cd main/api
npm run dev  # Uses nodemon for auto-reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev  # Vite dev server with hot reload
```

The API will be available at `http://localhost:3000` and the frontend at `http://localhost:5173`.

### Option 2: Production Build

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Start Backend:**
```bash
cd main/api
npm start
```

### Option 3: G Suite Management Scripts

#### Generate Users
Generate random users and insert them into the database:
```bash
node main/api/generate.js <domain> <count>
# Example: node main/api/generate.js example.com 100
```

#### Create Users in Google Workspace
Create users from database in Google Workspace:
```bash
node main/api/create.js
```
- Validates email format and password strength
- Creates users with first name, last name
- Handles errors gracefully with detailed logging

#### Delete Users from Google Workspace
Delete all users except admin:
```bash
node main/api/delete.js
```
- Protected admin account (won't delete admin)
- Batch processing with rate limiting
- Progress tracking

#### Detect Bounced Emails
Scan Gmail for bounced emails:
```bash
node main/api/bounce.js
```
- Scans "Mail Delivery Subsystem" messages
- Extracts bounced email addresses
- Stores results in bounce_logs table

#### Send Bulk Emails

**Via SMTP:**
```bash
node main/api/smtp.js
```

**Via Gmail API:**
```bash
node main/api/sendApi.js
```

Both methods:
- Use active email template and info from database
- Support placeholder replacement
- Log all send attempts
- Handle rate limiting

### Option 4: Automated Script
Use the all-in-one script for complete workflow:
```bash
bash script.sh
```
This script will:
1. Delete existing users
2. Generate new user data
3. Create users in Google Workspace
4. Activate less secure app access (if needed)

---

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

**Email Sending** (`/api/email-send`)
- `POST /api/email-send/gmail-api` - Send bulk emails via Gmail API
- `POST /api/email-send/smtp` - Send bulk emails via SMTP
- `POST /api/email-send/generate-users` - Generate random users
- `POST /api/email-send/bulk-recipients` - Add email recipients in bulk
- `GET /api/email-send/status` - Get email sending statistics and recent logs

**Campaign Management** (`/api/campaigns`, `/api/campaign-send`)
- Campaign Send endpoints for creating campaigns with cascading selection
- Campaign monitoring and control (pause, resume, kill)
- Real-time statistics and progress tracking
- Template management for reusable configurations

See the [API Documentation](main/api/API_DOCUMENTATION.md) for complete details on all endpoints.

---

## 🎨 Enhanced Campaign Send UI

The campaign creation interface has been redesigned for better usability and visual appeal:

### Key Features

**1. Stepped Process Flow**
- **Step 1: Campaign Information** - Basic details and provider selection
- **Step 2: Sponsor & Content** - Offer selection with rotation options
- **Step 3: Recipient Data** - Data providers and list selection
- **Step 4: Sending Configuration** - Batch size, delays, and limits

**2. Visual Enhancements**
- Gradient backgrounds for modern look
- Numbered step indicators
- Hover effects and smooth transitions
- Color-coded validation messages
- Sticky action bar for easy access

**3. Improved Validation**
- Real-time field validation
- Clear error messages under each field
- Required field indicators (red asterisk)
- Disabled state management

**4. Better User Guidance**
- Helper text under each field
- Contextual descriptions
- Loading states with spinners
- Success/error notifications

**5. Enhanced Preview**
- Beautiful green-themed preview card
- Grid layout showing key statistics
- Breakdown of exclusions (blacklisted, suppressed, bounced, unsubscribed)
- Large, readable numbers with proper formatting

**6. Content Rotation**
- Toggle to enable/disable rotation
- Visual indicator when rotation is active
- Manual selection when rotation is disabled
- Shows count of available creatives, from names, and subjects

---

**Tracking Links** (`/api/tracking-links`)
- `GET /api/tracking-links` - Get all standalone tracking links
- `GET /api/tracking-links/:id` - Get specific tracking link
- `POST /api/tracking-links` - Create new tracking link
- `POST /api/tracking-links/batch` - Create multiple tracking links
- `PUT /api/tracking-links/:id` - Update tracking link
- `DELETE /api/tracking-links/:id` - Delete tracking link
- `GET /api/tracking-links/:id/html` - Get HTML snippet for link
- `GET /api/tracking-links/:id/stats` - Get tracking link statistics
- `GET /t/c/:trackId` - Redirect endpoint (tracks click and redirects)

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
