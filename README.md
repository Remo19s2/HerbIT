# 🌿 HerbIT

> **Grow Knowledge. Nurture Nature.**  
> A Modern Full Stack Botanical Platform & Educational Encyclopedia.

---

## 📖 1. Project Description
**HerbIT** is an interactive, nature-inspired digital botanical platform designed to bridge traditional medicinal wisdom with modern web technologies and intelligent gardening assistance. 

It provides users with an accessible platform to explore therapeutic plants, Ayurvedic herbs, botanical classifications, traditional health benefits, parts used, and cultivation requirements. The application features a clean user exploration interface and an intuitive **Admin Portal** to demonstrate complete **CRUD (Create, Read, Update, Delete)** operations powered by a **Node.js/Express.js** REST API and **MongoDB Atlas**.

---

## 🎯 2. Project Objectives
- **Educational Awareness:** Document and showcase traditional Indian medicinal herbs (Tulsi, Neem, Ashwagandha, Turmeric, etc.) and their cultural/Ayurvedic uses.
- **Academic Demonstration:** Implement a robust full-stack architecture adhering to modern web development standards (HTML5, CSS3, Vanilla JavaScript, Express, Mongoose, MongoDB).
- **CRUD Operations:** Provide real-time data creation, retrieval, modification, and deletion through RESTful endpoints.
- **Simplicity & Reliability:** Maintain clean, lightweight code without complex heavy frameworks, ensuring high performance and ease of explanation during academic viva examinations.

---

## ✨ 3. Key Features

### 🌸 User Interface & Botanical Explorer (`index.html`)
- **Herbal Themed Hero Section:** Modern nature-inspired design with real-time statistics, search, and responsive navigation.
- **Dynamic Plant Explorer:** Instant search by plant name, scientific name, and description.
- **Category Filter Pills:** Seamless filtering by *Medicinal*, *Ayurvedic*, *Aromatic*, *Common Herbs*, or *Other*.
- **Detailed Modal Dialog:** In-depth view showcasing botanical taxonomy, traditional wellness benefits, anatomical parts used, and cultivation guides.
- **Quick Garden Addition:** One-click button inside plant modal to immediately add any botanical specimen to personal garden.
- **Responsive & Accessible Design:** Handcrafted pure CSS with mobile-friendly navigation and subtle micro-interactions.

### 👤 User Profiles & Account Management (`profile.html`)
- **Account Credentials & Overview:** View full name, email, account role, and member registration date.
- **Real-Time Garden Statistics:** Dynamic counter badges displaying saved plants, currently growing herbs, and marked favorites.
- **Profile Updates:** Self-service name updates with strict email/role immutability.
- **Secure Password Changes:** Requires active password verification before hashing and applying updates with `bcryptjs`.
- **Session Refresh:** Automatic session regeneration upon credential changes.

### 🪴 My Garden Personalized Sanctuary (`garden.html`)
- **Plant Sanctuary Dashboard:** Real-time KPI summary (Total Saved, Currently Growing, Mature, Favorites).
- **Status Pipeline Tracking:** 5 distinct growth phases: *Want to Grow*, *Growing*, *Mature*, *Learning*, and *No Longer Growing*.
- **Personal Botanical Notes:** In-place journal/notes editor for individual care notes, germination logs, and watering schedules.
- **Favorites & Search:** Quick-toggle heart badges and real-time garden search and status filter tabs.
- **Duplicate Prevention:** Enforces compound database unique constraints (`userId` + `plantId`).
- **Catalog Preservation:** Deleting a personal garden entry never impacts or deletes the canonical botanical record.

### 🌿 Community Plant Submissions (`submit-plant.html`)
- **Collaborative Proposals:** Authenticated users propose unrepresented medicinal plants with botanical names, taxonomy, uses, parts, and reference citations.
- **Transparent Distinction:** User contributions are explicitly distinguished from canonical verified research.
- **Submission Lifecycle:** Real-time moderation pipeline (*Pending*, *Approved*, *Rejected*).
- **Contributor Dashboard:** View past submission history with status badges, reviewer feedback, and withdrawal option for pending items.

### 🤖 Gemini AI Gardening Assistant - "Santhamithra AI" (`assistant.html`)
- **Botanical Guidance Persona:** Natural language assistance specializing in cultivation, propagation, soil mixtures, watering regimes, and seasonal herbal care.
- **Personalized Garden Context:** Automatically injects the user's active garden plants and statuses into prompts when enabled.
- **Rigorous Medical Safety Guardrails:** Strict educational orientation that prevents medical diagnoses, dosage prescription, or replacement of professional medical advice.
- **Graceful Key Handling:** Clear, structured instructions displayed if `GEMINI_API_KEY` is pending configuration.
- **Conversation Session Memory & Rate Limiting:** Interactive session chat log with query chips and rate limit protection.

### ⚙️ Enhanced Admin Dashboard (`admin.html`)
- **Unified Analytics Overview:** System-wide KPI cards showing total catalog herbs, registered users, garden entries, and pending submissions.
- **Plant Catalog CRUD:** Preserved full CRUD interface with live image preview, search, edit, delete, and dataset seeder.
- **User Accounts Directory:** Paginated user browser with live search, account status badges, and safe activation/deactivation controls (with self-lockout and last-admin protections).
- **Submission Moderation Queue:** Review pending community submissions, view contributor details, approve (which safely integrates into canonical Plant catalog without duplication), or reject with feedback notes.

---

## 🛠️ 4. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Custom Botanical Design System), Vanilla JavaScript (ES6+ `fetch` API) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas / Local MongoDB, Mongoose ODM |
| **Authentication & Security** | `express-session`, `connect-mongo`, `bcryptjs`, `express-rate-limit` |
| **AI Integration** | Google Gemini Generative AI REST API (`gemini-1.5-flash` / `gemini-pro`) |
| **Environment & Config** | `dotenv` (Environment Variables), `cors` (Cross-Origin Resource Sharing) |
| **Testing** | Node.js Test Runners (`scripts/testFullPhases.js`, `scripts/testAuth.js`) |
| **Dev Tools** | `nodemon` (Auto-reloading dev server) |

---

## 📂 5. Folder Structure

```
virtual-herbal-garden/
│
├── models/
│   ├── Plant.js             # Mongoose Schema for canonical medicinal plants
│   ├── User.js              # Mongoose Schema for users, passwords & roles
│   ├── GardenEntry.js       # Mongoose Schema for personalized user garden records
│   └── PlantSubmission.js   # Mongoose Schema for community plant submissions
│
├── routes/
│   ├── plantRoutes.js       # Plant catalog REST endpoints (Public GET / Admin CRUD)
│   ├── authRoutes.js        # Authentication endpoints (register, login, logout, me)
│   ├── userRoutes.js        # User profile & credentials management endpoints
│   ├── gardenRoutes.js      # My Garden CRUD, statuses, notes & favorites
│   ├── submissionRoutes.js  # Community plant submission & contributor routes
│   ├── adminRoutes.js       # Administrator stats, user management & moderation
│   └── assistantRoutes.js   # Gemini AI Gardening Assistant with garden context
│
├── middleware/
│   └── auth.js              # Session verification (isAuthenticated) & role checking (isAdmin)
│
├── data/
│   └── samplePlants.js      # Curated sample medicinal plants dataset
│
├── herb-database-main/
│   └── herb.json            # 360-record canonical Ayurvedic herb dataset
│
├── scripts/
│   ├── importHerbs.js       # Safe, idempotent dataset import script
│   ├── createAdmin.js       # CLI tool to provision or promote administrator accounts
│   ├── testAuth.js          # Phase 2 authentication test runner
│   └── testFullPhases.js    # Comprehensive end-to-end test suite for Phases 1-7
│
├── public/
│   ├── index.html           # HerbIT homepage & plant explorer
│   ├── garden.html          # My Garden personal dashboard & plant tracker
│   ├── garden.js            # My Garden interactive client-side logic
│   ├── profile.html         # User profile, statistics & password management
│   ├── submit-plant.html    # Community plant proposal & submission history
│   ├── submit-plant.js      # Community submission form & moderation tracking logic
│   ├── assistant.html       # Santhamithra AI Gardening Assistant interface
│   ├── assistant.js         # AI chat UI, quick prompt chips & context toggle
│   ├── admin.html           # Unified 4-tab administrator dashboard
│   ├── admin.js             # Admin statistics, catalog CRUD, user & moderation logic
│   ├── admin.css            # Admin tabs, data tables, and modal styling
│   ├── login.html           # Secure user authentication login page
│   ├── register.html        # New member account registration page
│   ├── style.css            # Global botanical design system & responsive layout
│   └── script.js            # Homepage plant explorer & dynamic navigation logic
│
├── .env                     # Private environment variables (PORT, MONGO_URI, SESSION_SECRET, GEMINI_API_KEY)
├── .env.example             # Template for environment configuration
├── .gitignore               # Ignored files (node_modules, .env)
├── package.json             # Project dependencies and npm scripts
├── server.js                # Express server entry point, route mounts & HTML route guards
├── seed.js                  # Standalone CLI database seeder script
└── README.md                # Comprehensive project documentation
```

---

## 🌿 6. Dataset Integration: Amidha Ayurveda Herb Database v2.0

The application is integrated with the canonical **Amidha Ayurveda Herb Database v2.0**, containing **360 curated Ayurvedic medicinal plants** with standardized botanical and pharmacological metadata.

### 📚 Dataset Attribution & Citation
- **Project**: Amidha Ayurveda Herb Database v2.0
- **Creator**: Sparsh Varshney (2026)
- **Official Website**: [https://www.amidhaayurveda.com/p/herb-database.html](https://www.amidhaayurveda.com/p/herb-database.html)
- **Zenodo DOI**: [10.5281/zenodo.17475351](https://doi.org/10.5281/zenodo.17475351)
- **License**: Creative Commons Attribution 4.0 International License ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/))

### 🧬 Integrated Properties
- **Nomenclature**: Common Name, Botanical Name, English Name, Botanical Family
- **Classical Sanskrit Synonyms**: Traditional Sanskrit designations (e.g., Surasa, Tejpatra)
- **Ayurvedic Pharmacology (Dravyaguna)**: Rasa (Taste), Guna (Qualities), Virya (Potency), Vipaka (Post-Digestive Effect), Prabhava (Specific Actions)
- **Dosha Karma**: Tridoshic, Doshas Pacified, Doshas Aggravated
- **Medicinal Parts & Indications**: Traditional Ayurvedic clinical indications and anatomical parts used
- **External Citations**: Direct reference link to Amidha Ayurveda research pages

---

## ☁️ 7. MongoDB Atlas Setup Instructions

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in or create a free account.
2. Build a new free **M0 Shared Cluster**.
3. Under **Database Access**, create a database user with a username and password.
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere (`0.0.0.0/0`)** (or add your current IP).
5. Click **Connect** on your cluster, select **Drivers (Node.js)**, and copy the connection string.
6. Open your `.env` file and paste your connection string:

```env
PORT=5000
MONGO_DB_NAME=herbal_garden
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/herbal_garden?retryWrites=true&w=majority
```

> **Important Node.js 20+ / TLS Note:** If using a standard replica set connection string (`mongodb://...`), use `tls=true` instead of the legacy `ssl=true` parameter to ensure compatibility with modern OpenSSL TLS 1.3 handshakes.

---

## 🚀 8. Installation & Dataset Import

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment (.env)
Ensure `.env` exists with your `PORT` and `MONGO_URI`.

### Step 3: Run the Safe Dataset Import
Import all 360 herbs from `herb-database-main/herb.json` safely into MongoDB Atlas:
```bash
npm run seed
# or
npm run import
```
*The import script (`scripts/importHerbs.js`) is completely idempotent: it automatically deduplicates records on repeated runs, preserves foundational plants with photo assets, and reports full import metrics.*

### Step 4: Start the Application
- **Production Mode:**
  ```bash
  npm start
  ```
- **Development Mode (with auto-reload):**
  ```bash
  npm run dev
  ```

### Step 5: Open in Browser
- **User View (Plant Explorer):** `http://localhost:5000`
- **Admin Dashboard:** `http://localhost:5000/admin.html`

---

## 📡 9. REST API Documentation

Base URL: `http://localhost:5000/api/plants`

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/plants` | Fetch all plants (supports multi-field search & category filter) | `200 OK` |
| **GET** | `/api/plants/:id` | Fetch details of a single plant by its MongoDB `_id` | `200 OK` / `404 Not Found` |
| **POST** | `/api/plants` | Add a new plant record to the database | `201 Created` / `400 Bad Request` |
| **PUT** | `/api/plants/:id` | Update an existing plant record | `200 OK` / `400 Bad Request` / `404 Not Found` |
| **DELETE**| `/api/plants/:id` | Delete a plant record from database | `200 OK` / `404 Not Found` |
| **POST** | `/api/plants/seed`| Synchronize database with the 360-record herb dataset | `200 OK` |
| **GET** | `/api/health` | Healthcheck and MongoDB Atlas connection status | `200 OK` |


---

## 📝 9. Sample JSON Request Bodies

### POST `/api/plants` (Add Plant)
```json
{
  "name": "Tulsi (Holy Basil)",
  "scientificName": "Ocimum tenuiflorum",
  "category": "Ayurvedic",
  "description": "Tulsi is revered in India as the Queen of Herbs and is an essential cornerstone of Ayurvedic wellness traditions.",
  "benefits": "Traditionally used to support respiratory health and vitality.",
  "partsUsed": "Leaves and seeds",
  "cultivation": "Thrives in warm, sunny locations with loamy, well-draining soil.",
  "image": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80"
}
```

### PUT `/api/plants/:id` (Update Plant)
```json
{
  "description": "Updated botanical overview with enhanced cultivation information.",
  "benefits": "Traditionally used for calming teas and respiratory ease."
}
```

---

## 🧪 10. How to Demonstrate the Project in a 5-Minute Viva

1. **Introduction (30s):**
   - *"Good morning/afternoon. This project is 'HerbIT' (Grow Knowledge. Nurture Nature), a full-stack educational botanical technology platform inspired by the SIH Virtual Herbal Garden problem statement."*
   - *"The stack is Vanilla HTML, CSS, JavaScript on the frontend, Node.js and Express.js on the backend, and MongoDB Atlas with Mongoose for persistence."*

2. **Homepage & Explorer (1.5 min):**
   - Show the responsive landing page, hero metrics, and "About" section.
   - Type `"Tulsi"` into the search bar to show instant client-side searching.
   - Click on category pills like `"Ayurvedic"` or `"Aromatic"` to show dynamic filtering.
   - Click **"View Details"** on any card to open the modal and display botanical description, benefits, parts used, and cultivation guide.

3. **Admin CRUD Demonstration (2 min):**
   - Navigate to `/admin.html`.
   - **Create (POST):** Fill out the form with a new herb (e.g., *"Ashwagandha"* or *"Brahmi"*) and click **Add Plant**. Show the toast notification and new table row.
   - **Read (GET):** Show how the table immediately reflects the newly added plant.
   - **Update (PUT):** Click the blue **Edit** button on any plant, modify its description or category, and click **Update Plant**.
   - **Delete (DELETE):** Click the red **Delete** button, confirm the modal prompt, and show that the record is removed from MongoDB.
   - **Reset Sample Data:** Click the **Reset Sample Data** button to demonstrate the automated seeder.

4. **Code Architecture & Viva Questions (1 min):**
   - Explain how `express.static('public')` serves the frontend.
   - Show `models/Plant.js` for schema validation and `routes/plantRoutes.js` for REST routing.
   - Explain that all communication happens via asynchronous `fetch()` API calls with JSON payloads.

---

## 💡 11. Common Errors & Fixes

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| `MongooseServerSelectionError` | MongoDB URI incorrect or IP not whitelisted | Check `.env` `MONGO_URI` and ensure `0.0.0.0/0` is allowed in Atlas Network Access. |
| `EADDRINUSE: address already in use` | Port 5000 is occupied by another process | Change `PORT=5001` in `.env` or terminate the existing node process. |
| Plant image does not load | Broken external image URL | The frontend includes an automatic fallback placeholder image if any external URL fails. |
| Form shows validation error | Missing one of the required fields | Ensure all 8 fields (Name, Scientific Name, Category, Image, Description, Benefits, Parts, Cultivation) are provided. |

---

---

## 🔐 12. Phase 2: User Authentication & Role-Based Access Control

### 🛡️ Architecture & Security Highlights
- **User Schema (`models/User.js`)**: Name, unique normalized email, bcrypt password hash (`saltWorkFactor: 10`), role (`user` or `admin`), timestamps. Password hashes are automatically stripped from all JSON responses via Mongoose `transform`.
- **Session Management (`express-session` & `connect-mongo`)**: Sessions stored securely in MongoDB Atlas (`sessions` collection). Cookies configured with `httpOnly: true`, `sameSite: 'lax'`, and `secure: process.env.NODE_ENV === 'production'`.
- **Session Fixation Defense**: Sessions are regenerated upon successful authentication (`req.session.regenerate`).
- **Brute-Force Rate Limiting (`express-rate-limit`)**: Authentication endpoints are rate-limited to 20 attempts per 15-minute window per IP.
- **Role-Based Authorization Middleware (`middleware/auth.js`)**:
  - `isAuthenticated`: Guarantees active session.
  - `isAdmin`: Protects administrator HTML routes and plant mutation API routes (`POST /api/plants`, `PUT /api/plants/:id`, `DELETE /api/plants/:id`, `POST /api/plants/seed`).
  - Unauthorized browser requests to `/admin.html` receive 302 redirects to `/login.html` or custom 403 Forbidden screens.
- **Initial Admin Provisioning (`scripts/createAdmin.js`)**:
  Admins are provisioned securely via CLI or environment variables without hardcoded credentials in source code.

### 📡 Authentication API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account (role is strictly `user`) | Public |
| `POST` | `/api/auth/login` | Authenticate credentials & initialize session cookie | Public |
| `POST` | `/api/auth/logout` | Terminate session & clear session cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch active user session information | Public |

### 🛠️ Administrative Setup Commands

To create or promote an administrator account safely:
```bash
node scripts/createAdmin.js "Botanical Administrator" "admin@herbalgarden.edu" "YourSecurePassword"
```

To run the complete automated Phase 2 test suite:
```bash
node scripts/testAuth.js
```

---

---

## 👤 13. Phase 3: User Profiles & Account Management

### 🛡️ Features & Security Controls
- **Authenticated Access (`middleware/auth.js`)**: All `/api/users/*` endpoints require `isAuthenticated`.
- **Identity Isolation**: The user ID is strictly derived from the validated server session (`req.session.userId`). Users can never inspect or alter other users' profiles.
- **Role & Email Immutability**: `PUT /api/users/me` strictly allows modifying the `fullName` only. Attempts to modify `email`, `role`, or `password` via ordinary profile updates are silently ignored or rejected.
- **Verified Password Rotation**: `PUT /api/users/me/password` verifies `currentPassword` against bcrypt hash before accepting `newPassword`.
- **Session Regeneration**: Regenerates the server session upon password rotation to protect against session fixation and hijack attempts.
- **Personal Garden KPI Aggregation**: Dynamically counts total saved plants, plants with status `Growing`, and marked favorites directly from the database.

### 📡 Profile API Endpoints
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` | Fetch active user profile and real-time garden stats | Authenticated |
| `PUT` | `/api/users/me` | Update member display name (email & role locked) | Authenticated |
| `PUT` | `/api/users/me/password` | Change password with current password verification | Authenticated |

---

## 🪴 14. Phase 4: My Garden Personal Sanctuary

### 🌿 Data Architecture (`models/GardenEntry.js`)
The `GardenEntry` collection maintains a personalized, many-to-one relationship with the canonical `Plant` collection:
- `userId` (ObjectId, ref: `'User'`, required, indexed)
- `plantId` (ObjectId, ref: `'Plant'`, required, indexed)
- `status` (String, enum: `['Want to Grow', 'Growing', 'Mature', 'Learning', 'No Longer Growing']`, default: `'Want to Grow'`)
- `isFavorite` (Boolean, default: `false`)
- `personalNotes` (String, max 2000 chars)
- `addedAt` / `updatedAt` (Timestamps)
- **Compound Unique Index**: `{ userId: 1, plantId: 1 }` guarantees that a user cannot add duplicate copies of the same plant to their personal garden, while allowing different users to save the same plant freely.

### 🛡️ Garden Security & Data Integrity
- **Ownership Verification**: All read, update, and delete actions verify `entry.userId.toString() === req.session.userId`.
- **Preservation of Canonical Plants**: Deleting a garden entry (`DELETE /api/garden/:id`) removes only the user's reference in `GardenEntry`. It **never deletes or modifies** the canonical `Plant` record.

### 📡 My Garden API Endpoints
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/garden` | Retrieve active user's garden entries (with populated plant data, search, & status filter) | Authenticated |
| `POST` | `/api/garden` | Add a plant to personal garden with initial status/notes | Authenticated |
| `GET` | `/api/garden/:id` | Get single garden entry details | Authenticated |
| `PUT` | `/api/garden/:id` | Update plant growth status, notes, or favorite flag | Authenticated |
| `DELETE` | `/api/garden/:id` | Remove plant from personal garden (preserves catalog plant) | Authenticated |

---

## 🌿 15. Phase 5: Community Plant Submissions

### 📝 Data Architecture (`models/PlantSubmission.js`)
Enables collaborative crowd-sourcing of underrepresented medicinal herbs:
- `submittedBy` (ObjectId, ref: `'User'`, required)
- `plantData`: Nested object containing `name`, `scientificName`, `englishName`, `category`, `family`, `description`, `benefits`, `partsUsed`, `cultivation`, `referenceUrl`, `image`
- `status` (String, enum: `['pending', 'approved', 'rejected']`, default: `'pending'`)
- `adminFeedback` (String)
- `reviewedBy` (ObjectId, ref: `'User'`)
- `reviewedAt` (Date)
- Timestamps

### 🛡️ Moderation Workflow & Safety
1. **Authenticated Contribution**: Users submit proposals via `POST /api/submissions`. The record enters the queue as `pending`.
2. **Contributor Self-Service**: Users track their own submissions via `GET /api/submissions/mine`, and may edit or withdraw (`DELETE /api/submissions/:id`) while status is `pending`.
3. **Administrator Review**: Authorized administrators (`isAdmin`) inspect proposals at `/admin.html` and review via `PATCH /api/admin/submissions/:id/review`.
4. **Canonical Catalog Promotion**: When an administrator approves a submission, the backend checks for existing canonical plants with the same name or scientific name. If absent, it automatically creates a new canonical `Plant` record, ensuring zero duplicates.
5. **Clear Attribution**: User submissions are clearly distinguished from verified botanical dataset records.

### 📡 Submission API Endpoints
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/submissions` | Submit a new medicinal plant proposal | Authenticated |
| `GET` | `/api/submissions/mine` | View authenticated user's submitted proposals | Authenticated |
| `GET` | `/api/submissions/:id` | View specific proposal details | Authenticated (Owner / Admin) |
| `PUT` | `/api/submissions/:id` | Edit pending proposal (pending items only) | Authenticated (Owner) |
| `DELETE` | `/api/submissions/:id` | Withdraw pending proposal | Authenticated (Owner) |

---

## ⚙️ 16. Phase 6: Enhanced Administrator Dashboard

### 📊 4-Tab Administrator Interface (`admin.html`)
1. **Overview & Analytics**: Live system KPI cards displaying Total Catalog Plants (368+), Total Registered Users, Total Garden Entries, Pending Submissions, Approved Submissions, and Rejected Submissions.
2. **Plant Catalog CRUD**: Full management of canonical database plants with live image preview, search, edit, delete, and dataset seeder.
3. **User Accounts Management**: Paginated user browser with live search, account status badges (`Active` / `Suspended`), and toggle controls.
   - **Self-Lockout Guard**: Prevents an administrator from deactivating their own account.
   - **Last-Admin Guard**: Prevents deactivating the final active administrator on the system.
4. **Submission Moderation Queue**: Review pending proposals with submitter details, approve with automatic catalog insertion, or reject with custom feedback.

### 📡 Administrative API Endpoints
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | System-wide statistics and overview KPIs | Admin Only |
| `GET` | `/api/admin/users` | Paginated user accounts list with search | Admin Only |
| `GET` | `/api/admin/users/:id` | Inspect specific user account details | Admin Only |
| `PATCH` | `/api/admin/users/:id/status` | Toggle user active/deactivated status | Admin Only |
| `GET` | `/api/admin/submissions` | Retrieve all community submissions (filtered by status) | Admin Only |
| `PATCH` | `/api/admin/submissions/:id/review` | Approve or reject submission with feedback | Admin Only |

---

## 🤖 17. Phase 7: Gemini AI Gardening Assistant - "Santhamithra AI"

### 🌿 Persona & System Architecture
- **AI Persona**: "Santhamithra AI", an expert botanical companion for smarter gardening.
- **Scope**: Natural language guidance on soil mixtures, watering frequency, sunlight requirements, propagation (cuttings, seeds, layering), pruning, pest control, and seasonal herbal care in Indian climates.
- **Personal Garden Context Injection**: When authenticated, the user can toggle "Include my garden context". The backend securely extracts the user's saved plant names and growth statuses, formatting a brief context block for Gemini without leaking private user data.
- **Medical Safety Disclaimer**: Strict guardrails instruct the AI never to prescribe medicinal dosages, diagnose ailments, or suggest replacing professional medical care with herbs.
- **Rate Limiting & Protection**: Dedicated rate limiter (`assistantLimiter`, 30 requests per 15 min per IP) and payload length limits.
- **Graceful Unconfigured Fallback**: If `GEMINI_API_KEY` is not present in `.env`, the assistant returns a helpful setup guide with instructions on generating an API key at Google AI Studio.

### 📡 Assistant API Endpoint
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/assistant/chat` | Send gardening query with optional garden context | Public / Authenticated |

---

## 🧪 18. Testing & Verification

The application features a comprehensive, non-destructive automated test suite that tests all 7 phases end-to-end against the running server.

### Running the Complete Test Suite
```bash
node scripts/testFullPhases.js
```

### Test Coverage (42 Assertions, 0 Failures):
- **Suite A: Authentication & Security (Tests 1–8)**
  - Registration, duplicate rejection, password hashing, session login, role escalation prevention, invalid password rejection, `/api/auth/me`, and logout.
- **Suite B: User Profiles (Tests 9–14)**
  - View own profile, live garden stats, update display name, role immutability enforcement, verify current password requirement, and change password.
- **Suite C: My Garden Operations (Tests 15–22)**
  - Add plant, compound duplicate prevention, fetch user garden, update growth status, edit personal notes, toggle favorite heart, cross-user isolation, and delete garden entry (verifying canonical plant is untouched).
- **Suite D: Community Submissions (Tests 23–29)**
  - Submit proposal, input validation, fetch user submissions, cross-user isolation, edit pending submission, withdraw submission, and non-admin review rejection.
- **Suite E: Administrator Dashboard & Moderation (Tests 30–35)**
  - Non-admin 403 enforcement, system statistics KPI accuracy, user directory pagination & search, self-lockout prevention, and admin approval integrating plant into catalog without duplication.
- **Suite F: Gemini AI Assistant (Tests 36–39)**
  - Missing/configured API key graceful handling, empty prompt validation, chat response delivery, and personal garden context injection.
- **Suite G: Catalog & Regression (Tests 40–42)**
  - Intact 368+ plant catalog preservation, search filtering, and public endpoint health.

---

## 🔐 19. Complete Environment Configuration (`.env`)

Create a `.env` file in the root directory:
```env
# Server Port
PORT=5000

# MongoDB Database Connection
MONGO_DB_NAME=herbal_garden
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/herbal_garden?retryWrites=true&w=majority

# Session Security Secret
SESSION_SECRET=your_super_secret_session_key_change_in_production
NODE_ENV=development

# Google Gemini AI Integration (Phases 3-7)
# Generate key from https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## ⚠️ 20. Known Limitations
1. **Gemini API Key Requirement**: Full dynamic AI responses require a valid `GEMINI_API_KEY` from Google AI Studio. Without it, the assistant displays a clear configuration guide explaining how to set up the key.
2. **Plant Imagery**: The Amidha Ayurveda dataset (360 herbs) focuses on standardized botanical taxonomy and medicinal indications; missing image URLs are gracefully displayed with elegant SVG botanical leaf placeholders.

---

## 📜 21. Academic Disclaimer
*This application is an educational, academic project developed for college laboratory coursework. Information provided regarding medicinal plants is based on traditional Ayurvedic texts and is not intended as medical advice or clinical diagnosis.*
