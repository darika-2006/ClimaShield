# ClimaShield TN 🛡️
### Tamil Nadu Climate & Disaster Risk Monitoring and Resilience Platform

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791.svg)](https://postgis.net/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**ClimaShield TN** is an end-to-end, geospatial early-warning and climate resilience platform engineered specifically for the state of **Tamil Nadu, India**. Built to empower citizens, disaster officers, and state emergency coordinators, ClimaShield TN combines real-time weather observations, live Doppler radar imagery, crowdsourced hazard reporting, PostGIS-powered geodesic shelter routing, and AI-assisted emergency advisory capabilities.

---

## 🌟 Key Features

### 1. 🗺️ Tamil Nadu Live GIS Map (`/tn-map`)
* **38-District Climate Monitoring**: Real-time district-by-district observation for temperature, precipitation, wind speeds, and vulnerability index.
* **RainViewer Doppler Radar**: Dynamic precipitation radar tile overlays animated with live radar telemetry.
* **Geodesic Hazard Zones**: Visual zoning for coastal cyclone corridors, Cauvery Delta flood zones, and Western Ghats landslide-prone hills.
* **Interactive District HUD**: Quick search and auto-zoom for all 38 districts of Tamil Nadu.

### 2. 🇮🇳 Pan-India Weather & Risk Overview (`/india`)
* **Interactive Choropleth**: D3-geo and TopoJSON/GeoJSON choropleth rendering India's 28 states and 8 union territories.
* **Alert Levels**: Real-time state-level classification into Normal, Moderate, Severe, and Extreme risk categories.

### 3. 👥 Citizen Portal & Incident Reporting (`/citizen`, `/report`)
* **Crowdsourced Incident Logging**: Report localized flooding, fallen trees, road blockages, and power line hazards with GPS coordinates and photographic proofs.
* **Geodesic Nearest Shelter Finder**: Instant calculation of closest relief shelters using PostGIS `ST_DistanceSphere` with driving distances and live occupancy numbers.
* **Personalized District Feed**: Auto-tailored hazard alerts and weather forecasts for the citizen's home district.

### 4. 🚨 Admin Command Center (`/admin`)
* **Incident Moderation Lifecycle**: Real-time queue for reviewing, verifying (`VERIFIED_ACTIVE`), resolving (`RESOLVED`), or rejecting citizen-submitted incident reports.
* **Emergency Broadcast Engine**: Dispatch state and district emergency advisories directly to affected zones.
* **Shelter Capacity Management**: Monitor live capacity and occupancy levels across all disaster shelters.

### 5. 🤖 TN Meenatchi AI - Emergency Chatbot
* **Bilingual Support**: Fluent in English and Tamil (தமிழ்).
* **Spatial Grounding**: Injects live GPS coordinates and geodesic shelter distances into the prompt context.
* **Resilient Architecture**: Google Gemini AI model inference with an automated deterministic safety-protocol fallback for emergency numbers (1070, 1077, 108, 101, 100).

### 6. ⏳ Climate Time Machine (`/time-machine`)
* **Decadal Climate Trends**: Comparative analytics (2014–2024) across major Tamil Nadu cities.
* **Satellite Land Cover & Heat Analysis**: Side-by-side satellite imagery inspection (Esri World Imagery & MODIS historical tiles).
* **Impervious Surface & Canopy Index**: Computes vegetation loss and thermal shifts across urbanizing hubs.

### 7. 🧪 Disaster Simulator (`/simulator`)
* **Scenario Modeling**: Simulate severe cyclonic landfall, reservoir release inundation, and heatwaves.
* **Impact Radius Calculation**: Estimate affected populations and resource requirements before disaster strikes.

### 8. 📐 Architecture Hub (`/architecture`)
* **Interactive System Blueprint**: Inspect frontend architecture, backend REST contracts, database tables, and external API integrations.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier (React 18 + Vite)"]
        UI["ClimaShield TN SPA"]
        Leaflet["Leaflet & D3 GIS Maps"]
        ChatUI["TN Meenatchi Chatbot UI"]
        State["Auth & Language Context"]
    end

    subgraph Server["Backend Tier (Node.js & Express)"]
        API["REST API Router (/api/v1)"]
        AuthMid["JWT Auth & Role Guard Middleware"]
        Controllers["Controllers (Alerts, Incidents, Shelters, Climate)"]
    end

    subgraph Data["Data & Cloud Services"]
        PG[("PostgreSQL + PostGIS (Supabase)")]
        OWM["OpenWeatherMap API"]
        RV["RainViewer Radar API"]
        Gemini["Google Gemini AI"]
    end

    UI -->|HTTP / REST| API
    ChatUI -->|Contextual Chat| API
    API --> AuthMid --> Controllers
    Controllers -->|SQL + ST_DistanceSphere| PG
    Controllers -->|Context Fallback| Gemini
    Leaflet -->|Doppler Tiles| RV
    UI -->|Direct Forecasts| OWM
```

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 8, React Router v7, `@stitches/react`, Framer Motion |
| **Geospatial & Viz** | Leaflet, React-Leaflet, D3-Geo, D3-Scale, Turf.js, Recharts, Lucide React |
| **Backend** | Node.js, Express.js 4, `pg` (node-postgres pool), Morgan, CORS |
| **Database** | PostgreSQL with PostGIS Spatial Extension (hosted via Supabase) |
| **Security** | JSON Web Tokens (JWT), `bcryptjs`, Role-Based Access Control (RBAC) |
| **Testing** | Jest, Supertest |
| **Reporting Suite** | Python 3, `python-docx`, Playwright (Chromium) |

---

## 📂 Project Directory Structure

```text
climashield-tn/
├── public/                       # Static assets and geo data
│   ├── data/
│   │   ├── demo_warnings.json    # Fallback disaster warning feeds
│   │   └── india-states-full.geojson # Full boundary map of India
│   ├── favicon.svg               # Application icon
│   └── icons.svg
│
├── src/                          # Frontend Application Source
│   ├── assets/                   # Images and logos
│   ├── components/               # Reusable UI & GIS components
│   │   ├── Badge.jsx             # Status badge component
│   │   ├── Button.jsx            # Themed action buttons
│   │   ├── Card.jsx              # Elevated glass cards
│   │   ├── EmergencyChatbot.jsx  # TN Meenatchi AI chatbot widget
│   │   ├── ErrorBanner.jsx       # Alert banners
│   │   ├── IndiaChoroplethMap.jsx# D3 GIS choropleth map
│   │   ├── LoadingSkeleton.jsx   # UI placeholder skeletons
│   │   ├── Navbar.jsx            # Navigation and language toggle
│   │   ├── ProtectedRoute.jsx    # RBAC route protection
│   │   ├── RecentlyAccessedBar.jsx # Audit trail of recent actions
│   │   └── StateDetailPanel.jsx  # Slide-over state statistics
│   ├── context/                  # React Contexts
│   │   ├── AuthContext.jsx       # JWT user session management
│   │   └── LanguageContext.jsx   # Bilingual i18n (en / ta)
│   ├── data/                     # District metadata and static registries
│   │   ├── stateCapitals.js      # Coordinates of state capitals
│   │   └── tnDistricts.js        # 38 Tamil Nadu districts master registry
│   ├── hooks/                    # Custom React hooks
│   │   └── useTNWeather.js       # Weather polling hook
│   ├── lib/                      # External SDK clients
│   │   └── supabaseClient.js     # Supabase JS client
│   ├── pages/                    # View pages & route screens
│   │   ├── AdminCommandCenter.jsx
│   │   ├── ArchitectureHub.jsx
│   │   ├── AuthCallback.jsx
│   │   ├── CitizenDashboard.jsx
│   │   ├── DisasterSimulator.jsx
│   │   ├── HomePage.jsx
│   │   ├── IndiaOverview.jsx
│   │   ├── LiveAlerts.jsx
│   │   ├── Login.jsx
│   │   ├── ReportIncidentPage.jsx
│   │   ├── TamilNaduLiveMap.jsx
│   │   └── TimeMachine.jsx
│   ├── services/                 # External service adapters
│   │   ├── rainViewerService.js  # RainViewer radar API adapter
│   │   └── weatherService.js     # OpenWeatherMap API adapter
│   ├── utils/                    # Formatting & color math
│   │   └── colorScale.js
│   ├── App.jsx                   # Root application router
│   ├── main.jsx                  # React application entry point
│   ├── index.css                 # Global styling
│   └── stitches.config.js        # Stitches design tokens
│
├── server/                       # Backend Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js             # PostgreSQL connection pool
│   │   ├── controllers/          # Business logic controllers
│   │   │   ├── adminController.js
│   │   │   ├── alertController.js
│   │   │   ├── authController.js
│   │   │   ├── chatbotController.js
│   │   │   ├── climateController.js
│   │   │   ├── incidentController.js
│   │   │   ├── shelterController.js
│   │   │   └── systemController.js
│   │   ├── middlewares/          # Express middlewares
│   │   │   ├── authMiddleware.js # JWT verification
│   │   │   └── roleMiddleware.js # Role-based access enforcement
│   │   ├── routes/               # API endpoint definitions
│   │   ├── seeds/
│   │   │   └── seedData.js       # PostGIS districts, shelters & persona seeder
│   │   └── app.js                # Express app initialization & server entry
│   ├── tests/                    # Backend automated tests
│   │   └── api.test.js           # Jest + Supertest integration suite
│   ├── schema.sql                # PostGIS tables, triggers and indexes
│   ├── package.json              # Server dependencies & scripts
│   ├── .env.example              # Template server environment file
│   └── .env                      # Local server secrets (git-ignored)
│
├── reports/                      # University Project Report & Automation Suite
│   ├── assets/                   # High-res diagrams, architecture & screenshots
│   ├── reference/                # Reference documents and raw scans
│   ├── build_full_report.py      # Automated 38-page docx report generator
│   ├── capture_screenshots.cjs   # Automated headless UI screenshot pipeline
│   ├── generate_diagrams.cjs     # Playwright SVG/HTML diagram generator
│   ├── ClimaShield_TN_Project_Report.docx # Formatted Word report
│   └── ClimaShield_TN_Project_Report.pdf  # Final compiled PDF report
│
├── .env.example                  # Template client environment file
├── .env                          # Local client secrets (git-ignored)
├── .gitignore                    # Git ignore configuration
├── eslint.config.js              # ESLint configuration
├── index.html                    # Single-page application HTML entry
├── package.json                  # Root dependencies & scripts
├── vite.config.js                # Vite build configuration
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **PostgreSQL / Supabase**: Instance with PostGIS extension enabled
* **Python 3**: (Optional) required only to re-generate the university report (`python-docx`)

---

### Step 1: Clone & Configure Environment

```bash
git clone https://github.com/your-username/climashield-tn.git
cd climashield-tn
```

#### 1. Client Environment (`.env`)
Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```
Update the values:
```env
VITE_WEATHER_API=your_openweathermap_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

#### 2. Server Environment (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```
Update database connection parameters:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres.your-project:your_password@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
```

---

### Step 2: Install Dependencies

Install root (client) dependencies:
```bash
npm install
```

Install server dependencies:
```bash
npm install --prefix server
```

---

### Step 3: Initialize Database & Seed Personas

Apply the PostGIS schema and seed core Tamil Nadu districts, relief shelters, historical weather telemetry, and pre-configured test users:

```bash
npm run seed --prefix server
```

#### Pre-configured Test Accounts:
| Role | Email | Password | Home District |
| :--- | :--- | :--- | :--- |
| **State Admin** | `admin@climashield.tn` | `AdminPassword123` | Chennai |
| **District Officer** | `officer.chennai@tnsdma.gov.in` | `OfficerPass123` | Chennai |
| **District Officer** | `officer.thoothukudi@tnsdma.gov.in` | `OfficerPass123` | Thoothukudi |
| **Citizen** | `darika.citizen@gmail.com` | `CitizenPass123` | Chennai |

---

### Step 4: Run the Application

#### Start Backend Server:
```bash
npm run dev --prefix server
```
* Backend API starts on: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/health`

#### Start Frontend Client:
```bash
npm run dev
```
* Frontend starts on: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run the backend integration test suite (exercises health, system seed state, historical climate queries, and PostGIS shelter proximity):

```bash
npm test --prefix server
```

To build and check frontend bundles:
```bash
npm run build
```

---

## 📡 REST API Endpoints Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health status check |
| `POST` | `/api/v1/auth/register` | Public | Register new user persona |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user and receive JWT |
| `GET` | `/api/v1/auth/me` | Protected | Fetch current user session details |
| `GET` | `/api/v1/shelters/nearby` | Public | PostGIS geodesic shelter proximity query (`?lat=..&lon=..`) |
| `GET` | `/api/v1/shelters/all` | Public | List all state shelters with occupancy |
| `GET` | `/api/v1/climate/historical` | Public | Fetch 2014–2024 annual climate metrics for a city |
| `GET` | `/api/v1/alerts/active` | Public | Retrieve active emergency warnings |
| `POST` | `/api/v1/incidents/report` | Protected | Submit field hazard report with coordinates & image |
| `GET` | `/api/v1/incidents/public` | Public | Fetch active, verified citizen hazard reports |
| `GET` | `/api/v1/incidents/pending` | Officer / Admin | Moderation queue for unverified reports |
| `PATCH` | `/api/v1/incidents/:id/verify` | Officer / Admin | Verify, resolve, or reject a citizen report |
| `POST` | `/api/v1/chat/message` | Public | AI emergency advisor with spatial shelter grounding |
| `GET` | `/api/v1/system/status` | Public | Database status and record count validation |

---

## 📄 Generating the University Project Report

The platform includes an automated reporting pipeline located in `reports/`:
```bash
# 1. Generate system diagrams (Class, ER, Architecture) via Playwright
node reports/generate_diagrams.cjs

# 2. Capture live application screenshots
node reports/capture_screenshots.cjs

# 3. Compile the 38-page formatted Word document
python3 reports/build_full_report.py
```
The output file is generated at `reports/ClimaShield_TN_Project_Report.docx`.

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
