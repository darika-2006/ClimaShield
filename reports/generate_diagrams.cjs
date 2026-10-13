const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');

// Helper to render HTML/SVG string to PNG using Playwright
async function renderHtmlToPng(browser, htmlContent, outputPath, width = 1200, height = 700) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2, // High resolution (retina / 300dpi equivalent)
  });
  await page.setContent(htmlContent);
  await page.waitForTimeout(500);
  const element = await page.$('#diagram-container');
  if (element) {
    await element.screenshot({ path: outputPath, omitBackground: false });
  } else {
    await page.screenshot({ path: outputPath, omitBackground: false });
  }
  await page.close();
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Class Diagram (Fig 4.1)
  console.log('Generating Fig 4.1: Class Diagram...');
  const classDiagramHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 0; padding: 20px; font-family: 'Times New Roman', serif; background: white; color: black; display: flex; justify-content: center; }
      #diagram-container { width: 1100px; padding: 20px; background: white; border: 1px solid #ccc; box-sizing: border-box; }
      h2 { text-align: center; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
      .class-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 20px; }
      .uml-box { border: 2px solid black; background: white; font-size: 12px; }
      .uml-header { background: #f0f0f0; border-bottom: 2px solid black; padding: 6px; text-align: center; font-weight: bold; font-size: 14px; }
      .uml-stereotype { font-size: 10px; font-weight: normal; font-style: italic; display: block; }
      .uml-attrs { padding: 8px; border-bottom: 1px solid black; line-height: 1.4; font-family: 'Courier New', monospace; font-size: 11px; }
      .uml-methods { padding: 8px; line-height: 1.4; font-family: 'Courier New', monospace; font-size: 11px; }
      .relations { margin-top: 24px; padding: 12px; border: 1px solid black; font-size: 12px; line-height: 1.6; }
      .rel-title { font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 12px; }
    </style>
  </head>
  <body>
    <div id="diagram-container">
      <h2>Figure 4.1: ClimaShield TN - Unified UML Class Diagram</h2>
      <div class="class-grid">
        
        <!-- User Class -->
        <div class="uml-box">
          <div class="uml-header">
            <span class="uml-stereotype">&laquo;Entity / Auth&raquo;</span>
            User
          </div>
          <div class="uml-attrs">
            + id: Integer [PK]<br/>
            + email: String (Unique)<br/>
            + password_hash: String<br/>
            + full_name: String<br/>
            + phone: String<br/>
            + role: UserRole [Enum]<br/>
            + home_district: String<br/>
            + home_lat: Decimal(8,4)<br/>
            + home_lon: Decimal(8,4)<br/>
            + auth_provider: String<br/>
            + created_at: Timestamp
          </div>
          <div class="uml-methods">
            + authenticate(pwd): Boolean<br/>
            + generateJWT(): String<br/>
            + updateProfile(data): Void<br/>
            + hasRole(role): Boolean
          </div>
        </div>

        <!-- CitizenReport Class -->
        <div class="uml-box">
          <div class="uml-header">
            <span class="uml-stereotype">&laquo;Spatial Entity&raquo;</span>
            CitizenReport
          </div>
          <div class="uml-attrs">
            + id: Integer [PK]<br/>
            + user_id: Integer [FK]<br/>
            + district: String<br/>
            + hazard_type: String<br/>
            + description: Text<br/>
            + image_url: String<br/>
            + status: ReportStatus<br/>
            + verified_by: Integer [FK]<br/>
            + verified_at: Timestamp<br/>
            + reported_lat: Decimal<br/>
            + reported_lon: Decimal<br/>
            + geom: Geometry(Point,4326)
          </div>
          <div class="uml-methods">
            + submitReport(): Void<br/>
            + updateStatus(newStatus): Void<br/>
            + calculateSpatialBuffer(): Poly<br/>
            + attachPhoto(url): Void
          </div>
        </div>

        <!-- District Class -->
        <div class="uml-box">
          <div class="uml-header">
            <span class="uml-stereotype">&laquo;Geospatial Boundary&raquo;</span>
            District
          </div>
          <div class="uml-attrs">
            + id: Integer [PK]<br/>
            + name: String<br/>
            + zone: String<br/>
            + lat: Decimal(8,4)<br/>
            + lon: Decimal(8,4)<br/>
            + is_flood_prone: Boolean<br/>
            + geom: Geometry(Polygon)<br/>
            + created_at: Timestamp
          </div>
          <div class="uml-methods">
            + getHistoricalClimate(): List<br/>
            + getActiveIncidents(): List<br/>
            + getShelters(): List<br/>
            + computeVulnerability(): Float
          </div>
        </div>

        <!-- Shelter Class -->
        <div class="uml-box">
          <div class="uml-header">
            <span class="uml-stereotype">&laquo;Relief Asset&raquo;</span>
            Shelter
          </div>
          <div class="uml-attrs">
            + id: Integer [PK]<br/>
            + district_id: Integer [FK]<br/>
            + name: String<br/>
            + capacity: Integer<br/>
            + current_occupancy: Integer<br/>
            + lat: Decimal(8,4)<br/>
            + lon: Decimal(8,4)<br/>
            + contact_phone: String<br/>
            + geom: Geometry(Point,4326)
          </div>
          <div class="uml-methods">
            + getAvailableCapacity(): Int<br/>
            + updateOccupancy(cnt): Void<br/>
            + isWithinRadius(km): Boolean<br/>
            + triggerEvacuation(): Void
          </div>
        </div>

        <!-- HistoricalClimate Class -->
        <div class="uml-box">
          <div class="uml-header">
            <span class="uml-stereotype">&laquo;Time-Series Observation&raquo;</span>
            HistoricalClimate
          </div>
          <div class="uml-attrs">
            + id: Integer [PK]<br/>
            + district_id: Integer [FK]<br/>
            + year: Integer<br/>
            + month: Integer<br/>
            + avg_temp_c: Decimal(4,2)<br/>
            + rainfall_mm: Decimal(6,2)<br/>
            + extreme_heat_days: Integer<br/>
            + created_at: Timestamp
          </div>
          <div class="uml-methods">
            + getAnnualSummary(): Object<br/>
            + detectAnomalies(): List<br/>
            + computeMonsoonVariance(): Dec
          </div>
        </div>

        <!-- Alert & Audit Logs -->
        <div class="uml-box">
          <div class="uml-header">
            <span class="uml-stereotype">&laquo;Advisory & Audit&raquo;</span>
            Alert / UserActivityLog
          </div>
          <div class="uml-attrs">
            + id: Integer [PK]<br/>
            + title / activity_type: String<br/>
            + severity / target: String<br/>
            + message / metadata: JSONB<br/>
            + target_district: String<br/>
            + dispatched_by: String<br/>
            + is_active: Boolean<br/>
            + created_at: Timestamp
          </div>
          <div class="uml-methods">
            + broadcastAlert(): Void<br/>
            + expireAdvisory(): Void<br/>
            + logAuditAction(): Void
          </div>
        </div>

      </div>

      <div class="relations">
        <div class="rel-title">UML Association & Cardinality Specifications</div>
        • <b>User (1) &mdash;&mdash;&mdash;&lt; (0..*) CitizenReport:</b> A citizen submits zero or more hazard reports; an administrator/officer verifies reports.<br/>
        • <b>User (1) &mdash;&mdash;&mdash;&lt; (0..*) UserActivityLog:</b> System tracks authentication, dispatch, and review operations per user.<br/>
        • <b>District (1) &mdash;&mdash;&mdash;&lt; (1..*) Shelter:</b> Each district encompasses multiple relief camps and emergency shelters.<br/>
        • <b>District (1) &mdash;&mdash;&mdash;&lt; (1..*) HistoricalClimate:</b> Master districts hold 35 years of monthly climate records (1990–2024).<br/>
        • <b>District (1) &mdash;&mdash;&mdash;&lt; (0..*) CitizenReport:</b> Spatial reports are partitioned and categorized by district boundaries.
      </div>
    </div>
  </body>
  </html>
  `;
  await renderHtmlToPng(browser, classDiagramHtml, path.join(ASSETS_DIR, 'fig4_1_class_diagram.png'), 1200, 750);

  // 2. ER Diagram (Fig 6.1)
  console.log('Generating Fig 6.1: ER Diagram...');
  const erDiagramHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 0; padding: 20px; font-family: 'Times New Roman', serif; background: white; color: black; display: flex; justify-content: center; }
      #diagram-container { width: 1100px; padding: 20px; background: white; border: 1px solid #ccc; box-sizing: border-box; }
      h2 { text-align: center; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
      .svg-wrap { width: 100%; display: flex; justify-content: center; margin-top: 10px; }
      svg text { font-family: 'Times New Roman', serif; }
    </style>
  </head>
  <body>
    <div id="diagram-container">
      <h2>Figure 6.1: ClimaShield TN - Entity-Relationship (ER) Architecture</h2>
      <div class="svg-wrap">
        <svg width="1050" height="580" viewBox="0 0 1050 580">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
            </marker>
          </defs>

          <!-- USERS Entity -->
          <rect x="50" y="50" width="220" height="200" fill="white" stroke="black" stroke-width="2"/>
          <rect x="50" y="50" width="220" height="30" fill="#f0f0f0" stroke="black" stroke-width="2"/>
          <text x="160" y="70" text-anchor="middle" font-weight="bold" font-size="14">USERS</text>
          <text x="60" y="100" font-size="11"><u>id</u> (PK) : INT</text>
          <text x="60" y="118" font-size="11">email (UQ) : VARCHAR(255)</text>
          <text x="60" y="136" font-size="11">password_hash : VARCHAR(255)</text>
          <text x="60" y="154" font-size="11">full_name : VARCHAR(150)</text>
          <text x="60" y="172" font-size="11">role : user_role [ENUM]</text>
          <text x="60" y="190" font-size="11">home_district : VARCHAR(100)</text>
          <text x="60" y="208" font-size="11">home_lat, home_lon : NUMERIC</text>
          <text x="60" y="226" font-size="11">created_at : TIMESTAMPTZ</text>

          <!-- Relationship: Submits -->
          <polygon points="410,100 450,125 410,150 370,125" fill="white" stroke="black" stroke-width="2"/>
          <text x="410" y="129" text-anchor="middle" font-size="11" font-weight="bold">SUBMITS</text>
          <line x1="270" y1="125" x2="370" y2="125" stroke="black" stroke-width="2"/>
          <text x="280" y="118" font-size="11" font-weight="bold">1</text>
          <line x1="450" y1="125" x2="550" y2="125" stroke="black" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="535" y="118" font-size="11" font-weight="bold">N</text>

          <!-- CITIZEN_REPORTS Entity -->
          <rect x="550" y="40" width="240" height="230" fill="white" stroke="black" stroke-width="2"/>
          <rect x="550" y="40" width="240" height="30" fill="#f0f0f0" stroke="black" stroke-width="2"/>
          <text x="670" y="60" text-anchor="middle" font-weight="bold" font-size="14">CITIZEN_REPORTS</text>
          <text x="560" y="90" font-size="11"><u>id</u> (PK) : INT</text>
          <text x="560" y="108" font-size="11">user_id (FK) : INT</text>
          <text x="560" y="126" font-size="11">district : VARCHAR(100)</text>
          <text x="560" y="144" font-size="11">hazard_type : VARCHAR(100)</text>
          <text x="560" y="162" font-size="11">description : TEXT</text>
          <text x="560" y="180" font-size="11">image_url : TEXT</text>
          <text x="560" y="198" font-size="11">status : report_status [ENUM]</text>
          <text x="560" y="216" font-size="11">verified_by (FK) : INT</text>
          <text x="560" y="234" font-size="11">geom : GEOMETRY(Point, 4326)</text>
          <text x="560" y="252" font-size="11">created_at : TIMESTAMPTZ</text>

          <!-- USER_ACTIVITY_LOGS Entity -->
          <rect x="50" y="360" width="220" height="150" fill="white" stroke="black" stroke-width="2"/>
          <rect x="50" y="360" width="220" height="30" fill="#f0f0f0" stroke="black" stroke-width="2"/>
          <text x="160" y="380" text-anchor="middle" font-weight="bold" font-size="13">USER_ACTIVITY_LOGS</text>
          <text x="60" y="410" font-size="11"><u>id</u> (PK) : INT</text>
          <text x="60" y="428" font-size="11">user_id (FK) : INT</text>
          <text x="60" y="446" font-size="11">activity_type : VARCHAR(50)</text>
          <text x="60" y="464" font-size="11">target_entity : VARCHAR(150)</text>
          <text x="60" y="482" font-size="11">metadata : JSONB</text>
          <text x="60" y="500" font-size="11">created_at : TIMESTAMPTZ</text>

          <!-- Relationship: Logs -->
          <polygon points="160,290 190,310 160,330 130,310" fill="white" stroke="black" stroke-width="2"/>
          <text x="160" y="314" text-anchor="middle" font-size="10" font-weight="bold">LOGS</text>
          <line x1="160" y1="250" x2="160" y2="290" stroke="black" stroke-width="2"/>
          <text x="165" y="265" font-size="11" font-weight="bold">1</text>
          <line x1="160" y1="330" x2="160" y2="360" stroke="black" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="165" y="350" font-size="11" font-weight="bold">N</text>

          <!-- DISTRICTS Entity -->
          <rect x="420" y="360" width="210" height="170" fill="white" stroke="black" stroke-width="2"/>
          <rect x="420" y="360" width="210" height="30" fill="#f0f0f0" stroke="black" stroke-width="2"/>
          <text x="525" y="380" text-anchor="middle" font-weight="bold" font-size="14">DISTRICTS</text>
          <text x="430" y="410" font-size="11"><u>id</u> (PK) : INT</text>
          <text x="430" y="428" font-size="11">name (UQ) : VARCHAR(100)</text>
          <text x="430" y="446" font-size="11">zone : VARCHAR(100)</text>
          <text x="430" y="464" font-size="11">lat, lon : NUMERIC(8,4)</text>
          <text x="430" y="482" font-size="11">is_flood_prone : BOOLEAN</text>
          <text x="430" y="500" font-size="11">geom : GEOMETRY(MultiPolygon)</text>
          <text x="430" y="518" font-size="11">created_at : TIMESTAMPTZ</text>

          <!-- SHELTERS Entity -->
          <rect x="790" y="360" width="220" height="170" fill="white" stroke="black" stroke-width="2"/>
          <rect x="790" y="360" width="220" height="30" fill="#f0f0f0" stroke="black" stroke-width="2"/>
          <text x="900" y="380" text-anchor="middle" font-weight="bold" font-size="14">SHELTERS</text>
          <text x="800" y="410" font-size="11"><u>id</u> (PK) : INT</text>
          <text x="800" y="428" font-size="11">district_id (FK) : INT</text>
          <text x="800" y="446" font-size="11">name : VARCHAR(150)</text>
          <text x="800" y="464" font-size="11">capacity : INT</text>
          <text x="800" y="482" font-size="11">current_occupancy : INT</text>
          <text x="800" y="500" font-size="11">contact_phone : VARCHAR(25)</text>
          <text x="800" y="518" font-size="11">geom : GEOMETRY(Point, 4326)</text>

          <!-- Relationship: Houses -->
          <polygon points="710,430 740,450 710,470 680,450" fill="white" stroke="black" stroke-width="2"/>
          <text x="710" y="454" text-anchor="middle" font-size="10" font-weight="bold">HOUSES</text>
          <line x1="630" y1="450" x2="680" y2="450" stroke="black" stroke-width="2"/>
          <text x="640" y="442" font-size="11" font-weight="bold">1</text>
          <line x1="740" y1="450" x2="790" y2="450" stroke="black" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="780" y="442" font-size="11" font-weight="bold">N</text>

          <!-- Relationship: Categorizes (District to CitizenReports) -->
          <line x1="525" y1="360" x2="600" y2="270" stroke="black" stroke-dasharray="4" stroke-width="1.5" marker-end="url(#arrow)"/>
          <text x="560" y="330" font-size="10" font-style="italic">categorizes (1:N)</text>

        </svg>
      </div>
    </div>
  </body>
  </html>
  `;
  await renderHtmlToPng(browser, erDiagramHtml, path.join(ASSETS_DIR, 'fig6_1_er_diagram.png'), 1200, 680);

  // 3. System Architecture Diagram (Fig 7.1)
  console.log('Generating Fig 7.1: Multi-Tier Architecture Diagram...');
  const archDiagramHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 0; padding: 20px; font-family: 'Times New Roman', serif; background: white; color: black; display: flex; justify-content: center; }
      #diagram-container { width: 1100px; padding: 20px; background: white; border: 1px solid #ccc; box-sizing: border-box; }
      h2 { text-align: center; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
      .layer { border: 2px solid black; margin-bottom: 16px; padding: 12px; background: white; }
      .layer-title { font-weight: bold; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid black; padding-bottom: 4px; margin-bottom: 10px; display: flex; justify-content: space-between; }
      .box-row { display: flex; gap: 14px; }
      .arch-box { flex: 1; border: 1px solid black; padding: 8px; background: #fafafa; font-size: 11px; text-align: center; }
      .arch-box b { display: block; font-size: 12px; margin-bottom: 4px; }
      .arrow-down { text-align: center; font-size: 16px; font-weight: bold; margin: -10px 0 6px 0; }
    </style>
  </head>
  <body>
    <div id="diagram-container">
      <h2>Figure 7.1: ClimaShield TN - Multi-Tier System Architecture</h2>
      
      <!-- Tier 1: Client Layer -->
      <div class="layer">
        <div class="layer-title">
          <span>Tier 1: Client Presentation Layer (SPA Frontend)</span>
          <span>React 18 + Vite + Stitches CSS</span>
        </div>
        <div class="box-row">
          <div class="arch-box">
            <b>Tamil Nadu Live Map</b>
            Leaflet Vector Layers &middot; Radar Tiles &middot; Hazard Markers
          </div>
          <div class="arch-box">
            <b>Citizen Emergency Hub</b>
            SOS Geolocation &middot; Shelter Routing &middot; Incident Form
          </div>
          <div class="arch-box">
            <b>State Command Center</b>
            Incident Triage &middot; Shelter Occupancy &middot; Alert Dispatch
          </div>
          <div class="arch-box">
            <b>Climate Intelligence</b>
            D3 Choropleth Map &middot; Recharts Time Machine &middot; Simulator
          </div>
          <div class="arch-box">
            <b>Emergency AI Assistant</b>
            Bilingual Chatbot &middot; Context Prompts &middot; Helplines
          </div>
        </div>
      </div>

      <div class="arrow-down">&darr; JSON REST Protocol (HTTPS / JWT Bearer Tokens) &uarr;</div>

      <!-- Tier 2: Backend & Middleware -->
      <div class="layer">
        <div class="layer-title">
          <span>Tier 2: Application API & Middleware Layer</span>
          <span>Node.js + Express REST Framework</span>
        </div>
        <div class="box-row">
          <div class="arch-box">
            <b>Security & Middleware</b>
            CORS &middot; Morgan &middot; JWT Verify &middot; RBAC Authorizer
          </div>
          <div class="arch-box">
            <b>Spatial Geodesic Engine</b>
            ST_DWithin Nearby Shelters &middot; Distance KM Calculations
          </div>
          <div class="arch-box">
            <b>Incident State Machine</b>
            Review &middot; Verification &middot; GPS Buffer &middot; Auto-Geom
          </div>
          <div class="arch-box">
            <b>Climate Time-Series</b>
            Aggregations &middot; Heat Index &middot; District Vulnerability
          </div>
          <div class="arch-box">
            <b>Chatbot Controller</b>
            Intent Parsing &middot; Local Knowledge Base &middot; Safety Rules
          </div>
        </div>
      </div>

      <div class="arrow-down">&darr; TCP Connection Pool (Parameterized SQL / PostGIS Geometry) &uarr;</div>

      <!-- Tier 3: Persistence & External Feeds -->
      <div class="layer">
        <div class="layer-title">
          <span>Tier 3: Database & External Telemetry Infrastructure</span>
          <span>Supabase PostgreSQL + PostGIS &middot; External APIs</span>
        </div>
        <div class="box-row">
          <div class="arch-box" style="flex: 2;">
            <b>Supabase Managed PostgreSQL with PostGIS Extension</b>
            R-Tree GiST Spatial Indexes &middot; EPSG:4326 Coordinate Systems &middot; Spatial Functions (ST_MakePoint, ST_SetSRID)
            <div style="margin-top: 6px; font-size: 10px; font-family: 'Courier New', monospace;">
              Tables: users &middot; districts &middot; shelters &middot; citizen_reports &middot; historical_climate &middot; alerts &middot; user_activity_logs
            </div>
          </div>
          <div class="arch-box">
            <b>OpenWeatherMap API</b>
            Live Temperature &middot; Wind Speed &middot; Pressure Feeds
          </div>
          <div class="arch-box">
            <b>RainViewer API</b>
            Doppler Precipitation Radar &middot; Satellite Cloud Tiles
          </div>
        </div>
      </div>

    </div>
  </body>
  </html>
  `;
  await renderHtmlToPng(browser, archDiagramHtml, path.join(ASSETS_DIR, 'fig7_1_system_architecture.png'), 1200, 680);

  // 4. Incident Lifecycle State Machine (Fig 8.11)
  console.log('Generating Fig 8.11: Incident Lifecycle State Machine...');
  const stateMachineHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 0; padding: 20px; font-family: 'Times New Roman', serif; background: white; color: black; display: flex; justify-content: center; }
      #diagram-container { width: 1100px; padding: 20px; background: white; border: 1px solid #ccc; box-sizing: border-box; }
      h2 { text-align: center; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
      .svg-wrap { width: 100%; display: flex; justify-content: center; margin-top: 15px; }
      svg text { font-family: 'Times New Roman', serif; }
    </style>
  </head>
  <body>
    <div id="diagram-container">
      <h2>Figure 8.11: Citizen Incident Verification State Machine & Workflow</h2>
      <div class="svg-wrap">
        <svg width="1050" height="340" viewBox="0 0 1050 340">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
            </marker>
          </defs>

          <!-- Start State -->
          <circle cx="60" cy="170" r="14" fill="black"/>
          <text x="60" y="210" text-anchor="middle" font-size="11" font-weight="bold">START</text>

          <!-- Transition to PENDING_REVIEW -->
          <line x1="74" y1="170" x2="190" y2="170" stroke="black" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="130" y="160" text-anchor="middle" font-size="10">Citizen Submits GPS Report</text>

          <!-- State: PENDING_REVIEW -->
          <rect x="200" y="130" width="180" height="80" rx="8" fill="white" stroke="black" stroke-width="2"/>
          <text x="290" y="165" text-anchor="middle" font-weight="bold" font-size="13">PENDING_REVIEW</text>
          <text x="290" y="185" text-anchor="middle" font-size="10" font-style="italic">Triage Queue &middot; Auto-Geom</text>

          <!-- Transition to VERIFIED_ACTIVE -->
          <line x1="380" y1="150" x2="520" y2="100" stroke="black" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="470" y="115" text-anchor="middle" font-size="10">Officer Confirms Hazard & Photo</text>

          <!-- State: VERIFIED_ACTIVE -->
          <rect x="530" y="60" width="190" height="80" rx="8" fill="white" stroke="black" stroke-width="2"/>
          <text x="625" y="95" text-anchor="middle" font-weight="bold" font-size="13">VERIFIED_ACTIVE</text>
          <text x="625" y="115" text-anchor="middle" font-size="10" font-style="italic">Live Map Alert &middot; Resource Dispatch</text>

          <!-- Transition to REJECTED -->
          <line x1="380" y1="190" x2="520" y2="240" stroke="black" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="470" y="235" text-anchor="middle" font-size="10">Invalid / False Report</text>

          <!-- State: REJECTED -->
          <rect x="530" y="200" width="190" height="80" rx="8" fill="white" stroke="black" stroke-width="2"/>
          <text x="625" y="235" text-anchor="middle" font-weight="bold" font-size="13">REJECTED</text>
          <text x="625" y="255" text-anchor="middle" font-size="10" font-style="italic">Dismissed &middot; Audit Logged</text>

          <!-- Transition to RESOLVED -->
          <line x1="720" y1="100" x2="840" y2="100" stroke="black" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="780" y="90" text-anchor="middle" font-size="10">Relief Teams Clear Hazard</text>

          <!-- State: RESOLVED -->
          <rect x="850" y="60" width="160" height="80" rx="8" fill="white" stroke="black" stroke-width="2"/>
          <text x="930" y="95" text-anchor="middle" font-weight="bold" font-size="13">RESOLVED</text>
          <text x="930" y="115" text-anchor="middle" font-size="10" font-style="italic">Archived &middot; Shelters Updated</text>

          <!-- End State from RESOLVED -->
          <circle cx="930" cy="240" r="16" fill="white" stroke="black" stroke-width="2"/>
          <circle cx="930" cy="240" r="10" fill="black"/>
          <line x1="930" y1="140" x2="930" y2="220" stroke="black" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="930" y="275" text-anchor="middle" font-size="11" font-weight="bold">CLOSED</text>

          <!-- Transition from REJECTED to END -->
          <line x1="720" y1="240" x2="910" y2="240" stroke="black" stroke-width="2" marker-end="url(#arrow)"/>

        </svg>
      </div>
    </div>
  </body>
  </html>
  `;
  await renderHtmlToPng(browser, stateMachineHtml, path.join(ASSETS_DIR, 'fig8_11_incident_lifecycle.png'), 1200, 420);

  console.log('✅ ALL Black-and-White Diagrams successfully generated and saved!');
  await browser.close();
}

main();
