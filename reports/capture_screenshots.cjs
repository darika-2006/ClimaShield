const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ASSETS_DIR = path.join(__dirname, 'assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

function loginApi(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function capture() {
  console.log('🚀 Authenticating accounts via backend REST API...');
  const citizenAuth = await loginApi('darika.citizen@gmail.com', 'CitizenPass123');
  const adminAuth = await loginApi('admin@climashield.tn', 'AdminPassword123');

  console.log('✅ Citizen auth:', citizenAuth.success, citizenAuth.user.full_name);
  console.log('✅ Admin auth:', adminAuth.success, adminAuth.user.full_name);

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  try {
    // 1. Home Page
    console.log('📸 1. Capturing Home Page...');
    await page.goto('http://localhost:5173/home', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_4_home.png') });

    // 2. Tamil Nadu Live Map
    console.log('📸 2. Capturing Tamil Nadu Live Hazard Map...');
    await page.goto('http://localhost:5173/tn-map', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_4b_tn_live_map.png') });

    // 3. Login Page
    console.log('📸 3. Capturing Login Page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_5_login.png') });

    // Set Citizen Credentials into LocalStorage
    console.log('🔑 Injecting Citizen Auth into LocalStorage...');
    await page.evaluate((auth) => {
      localStorage.setItem('climashield_jwt_token', auth.token);
      localStorage.setItem('climashield_user', JSON.stringify(auth.user));
      localStorage.setItem('token', auth.token);
    }, citizenAuth);

    // 4. Citizen Dashboard
    console.log('📸 4. Capturing Citizen Dashboard...');
    await page.goto('http://localhost:5173/citizen', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_6_citizen_dashboard.png') });

    // 5. Report Incident Page
    console.log('📸 5. Capturing Report Incident Page...');
    await page.goto('http://localhost:5173/report', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_7_report_incident.png') });

    // 6. Disaster Time Machine
    console.log('📸 6. Capturing Disaster Time Machine...');
    await page.goto('http://localhost:5173/timeline', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_8_time_machine.png') });

    // 7. Pan-India Overview
    console.log('📸 7. Capturing Pan-India Climate Risk Overview...');
    await page.goto('http://localhost:5173/india', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_10_india_overview.png') });

    // Set Admin Credentials into LocalStorage
    console.log('🔑 Injecting Admin Auth into LocalStorage...');
    await page.evaluate((auth) => {
      localStorage.setItem('climashield_jwt_token', auth.token);
      localStorage.setItem('climashield_user', JSON.stringify(auth.user));
      localStorage.setItem('token', auth.token);
    }, adminAuth);

    // 8. Admin Command Center
    console.log('📸 8. Capturing Admin Command Center...');
    await page.goto('http://localhost:5173/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_12_admin_command_center.png') });

    // 9. Disaster Simulator
    console.log('📸 9. Capturing Disaster Simulator...');
    await page.goto('http://localhost:5173/simulator', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_9_disaster_simulator.png') });

    // 10. Architecture Hub
    console.log('📸 10. Capturing Architecture Hub...');
    await page.goto('http://localhost:5173/architecture', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_14_architecture_hub.png') });

    // 11. Live Alerts
    console.log('📸 11. Capturing Live Alerts...');
    await page.goto('http://localhost:5173/alerts', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ASSETS_DIR, 'live_alerts.png') });

    // 12. Emergency AI Chatbot opened
    console.log('📸 12. Capturing Emergency AI Chatbot...');
    await page.goto('http://localhost:5173/citizen', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    const chatBtn = await page.$('button[aria-label="Open Emergency Chatbot"], button:has-text("AI"), [class*="chat"]');
    if (chatBtn) {
      await chatBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: path.join(ASSETS_DIR, 'fig8_13_emergency_chatbot.png') });

    console.log('✅ ALL screenshots successfully captured with full authentic views!');
  } catch (err) {
    console.error('❌ Capture error:', err);
  } finally {
    await browser.close();
  }
}

capture();
