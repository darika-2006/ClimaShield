const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const CORE_DISTRICTS = [
  { name: 'Chennai', zone: 'Metropolitan Coastal / Cyclone Belt', lat: 13.0827, lon: 80.2707, is_flood_prone: true },
  { name: 'Coimbatore', zone: 'Western Ghats / Plateau', lat: 11.0168, lon: 76.9558, is_flood_prone: false },
  { name: 'Madurai', zone: 'Vaigai River Basin', lat: 9.9252, lon: 78.1198, is_flood_prone: false },
  { name: 'Tiruchirappalli', zone: 'Central Cauvery River Hub', lat: 10.7905, lon: 78.7047, is_flood_prone: false },
  { name: 'Salem', zone: 'North-Central Mineral Belt', lat: 11.6643, lon: 78.1460, is_flood_prone: false },
  { name: 'Tirunelveli', zone: 'Thamirabarani River Basin', lat: 8.7139, lon: 77.7567, is_flood_prone: true },
  { name: 'Thoothukudi', zone: 'Deep South Gulf Coast & Port Zone', lat: 8.7642, lon: 78.1348, is_flood_prone: true },
  { name: 'Cuddalore', zone: 'Severe Coastal Cyclone Zone', lat: 11.7480, lon: 79.7714, is_flood_prone: true }
];

const SHELTERS = [
  { districtName: 'Chennai', name: 'Mylapore Emergency Relief Center', capacity: 1000, current_occupancy: 200, lat: 13.0338, lon: 80.2676, contact_phone: '+91-44-24981001' },
  { districtName: 'Chennai', name: 'Velachery Community Flood Shelter', capacity: 600, current_occupancy: 450, lat: 12.9815, lon: 80.2180, contact_phone: '+91-44-22431102' },
  { districtName: 'Chennai', name: 'Tambaram Evacuation Shelter', capacity: 850, current_occupancy: 120, lat: 12.9229, lon: 80.1275, contact_phone: '+91-44-22265001' },
  { districtName: 'Cuddalore', name: 'Cuddalore Port Coastal Cyclone Center', capacity: 1000, current_occupancy: 200, lat: 11.7510, lon: 79.7680, contact_phone: '+91-4142-230100' },
  { districtName: 'Thoothukudi', name: 'VOC Port Disaster Relief Center, Thoothukudi', capacity: 900, current_occupancy: 150, lat: 8.7580, lon: 78.1420, contact_phone: '+91-461-2352201' },
  { districtName: 'Madurai', name: 'Madurai Corporation Central Relief Camp, Tallakulam', capacity: 1200, current_occupancy: 180, lat: 9.9320, lon: 78.1360, contact_phone: '+91-452-2531001' },
  { districtName: 'Madurai', name: 'Vaigai River Basin High-Ground Relief Hub, Arapalayam', capacity: 950, current_occupancy: 110, lat: 9.9380, lon: 78.1060, contact_phone: '+91-452-2532002' },
  { districtName: 'Coimbatore', name: 'Coimbatore North Community Relief Campus', capacity: 1100, current_occupancy: 220, lat: 11.0250, lon: 76.9600, contact_phone: '+91-422-2300101' },
  { districtName: 'Tiruchirappalli', name: 'Cauvery Delta Emergency Assembly Hall, Srirangam', capacity: 1400, current_occupancy: 310, lat: 10.8620, lon: 78.6940, contact_phone: '+91-431-2432001' },
  { districtName: 'Salem', name: 'Salem Town Relief & Staging Ground', capacity: 800, current_occupancy: 90, lat: 11.6600, lon: 78.1500, contact_phone: '+91-427-2211001' },
  { districtName: 'Tirunelveli', name: 'Palayamkottai Multi-Purpose Relief Center', capacity: 1000, current_occupancy: 140, lat: 8.7180, lon: 77.7400, contact_phone: '+91-462-2572001' }
];

const PRESEEDED_PERSONAS = [
  {
    email: 'admin@climashield.tn',
    password: 'AdminPassword123',
    full_name: 'State Disaster Commander',
    role: 'ADMIN',
    home_district: 'Chennai',
    home_lat: 13.0827,
    home_lon: 80.2707,
  },
  {
    email: 'officer.chennai@tnsdma.gov.in',
    password: 'OfficerPass123',
    full_name: 'Chennai District Disaster Officer',
    role: 'DISTRICT_OFFICER',
    home_district: 'Chennai',
    home_lat: 13.0827,
    home_lon: 80.2707,
  },
  {
    email: 'officer.thoothukudi@tnsdma.gov.in',
    password: 'OfficerPass123',
    full_name: 'Thoothukudi District Disaster Officer',
    role: 'DISTRICT_OFFICER',
    home_district: 'Thoothukudi',
    home_lat: 8.7642,
    home_lon: 78.1348,
  },
  {
    email: 'darika.citizen@gmail.com',
    password: 'CitizenPass123',
    full_name: 'Darika Sivakumar',
    role: 'CITIZEN',
    home_district: 'Thoothukudi',
    home_lat: 9.1724,
    home_lon: 77.8690,
  },
  {
    email: 'anand.citizen@gmail.com',
    password: 'CitizenPass123',
    full_name: 'Anand Kumar',
    role: 'CITIZEN',
    home_district: 'Chennai',
    home_lat: 12.9815,
    home_lon: 80.2180,
  },
];

async function seed() {
  console.log('🌱 Starting ClimaShield TN Enterprise Database Seeding...');
  const startTime = Date.now();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Run schema DDL
    const schemaSqlPath = path.join(__dirname, '../../schema.sql');
    if (fs.existsSync(schemaSqlPath)) {
      const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
      await client.query(schemaSql);
      console.log('📋 Applied database schema DDL.');
    }

    // 2. Seed Master Districts
    console.log('📍 Seeding Master Tamil Nadu Districts...');
    const districtValues = [];
    const districtValueStrings = [];
    let dParamIdx = 1;

    for (const d of CORE_DISTRICTS) {
      districtValueStrings.push(`($${dParamIdx}, $${dParamIdx + 1}, $${dParamIdx + 2}, $${dParamIdx + 3}, $${dParamIdx + 4})`);
      districtValues.push(d.name, d.zone, d.lat, d.lon, d.is_flood_prone);
      dParamIdx += 5;
    }

    const districtsQuery = `
      INSERT INTO districts (name, zone, lat, lon, is_flood_prone)
      VALUES ${districtValueStrings.join(', ')}
      ON CONFLICT (name) DO UPDATE 
      SET zone = EXCLUDED.zone, lat = EXCLUDED.lat, lon = EXCLUDED.lon, is_flood_prone = EXCLUDED.is_flood_prone;
    `;
    await client.query(districtsQuery, districtValues);

    const distRes = await client.query('SELECT id, name FROM districts;');
    const districtMap = {};
    for (const row of distRes.rows) {
      districtMap[row.name] = row.id;
    }
    console.log(`✅ Seeded ${Object.keys(districtMap).length} master districts.`);

    // 3. Seed 5 Pre-seeded Personas with Bcrypt Password Hashing
    console.log('🔐 Seeding 5 Enterprise Pre-seeded User Persona Logins...');
    for (const p of PRESEEDED_PERSONAS) {
      const hash = await bcrypt.hash(p.password, 10);
      await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, home_district, home_lat, home_lon, auth_provider)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'LOCAL')
         ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             full_name = EXCLUDED.full_name,
             role = EXCLUDED.role,
             home_district = EXCLUDED.home_district,
             home_lat = EXCLUDED.home_lat,
             home_lon = EXCLUDED.home_lon;`,
        [p.email, hash, p.full_name, p.role, p.home_district, p.home_lat, p.home_lon]
      );
    }
    console.log('✅ Seeded 5 enterprise user personas (Admin, 2 Officers, 2 Citizens).');

    // 4. Seed Climate Records (1990 - 2024)
    console.log('📊 Generating & Bulk-Inserting Monthly Climate Records (1990 - 2024)...');
    const climateValues = [];
    const climateValueStrings = [];
    let cParamIdx = 1;

    for (const [dName, dId] of Object.entries(districtMap)) {
      const isCoast = dName === 'Chennai' || dName === 'Cuddalore' || dName === 'Thoothukudi';
      const isCool = dName === 'Coimbatore';

      for (let year = 1990; year <= 2024; year++) {
        const yearWarming = (year - 1990) * 0.04;

        for (let month = 1; month <= 12; month++) {
          let baseTemp = 29.0;
          let baseRain = 20.0;

          if (month >= 4 && month <= 6) {
            baseTemp = 36.5;
            baseRain = 15.0;
          } else if (month >= 10 && month <= 12) {
            baseTemp = 27.0;
            baseRain = isCoast ? 220.0 : 85.0;
          }

          if (isCool) baseTemp -= 3.5;

          const tempVariance = (Math.random() * 2 - 1) * 1.2;
          const avgTempC = parseFloat((baseTemp + yearWarming + tempVariance).toFixed(2));

          const rainVariance = Math.random() * 0.6 + 0.7;
          const rainfallMm = parseFloat((baseRain * rainVariance).toFixed(2));

          let extremeHeatDays = 0;
          if (avgTempC >= 37.0) {
            extremeHeatDays = Math.floor(Math.random() * 12) + 3;
          }

          climateValueStrings.push(`($${cParamIdx}, $${cParamIdx + 1}, $${cParamIdx + 2}, $${cParamIdx + 3}, $${cParamIdx + 4}, $${cParamIdx + 5})`);
          climateValues.push(dId, year, month, avgTempC, rainfallMm, extremeHeatDays);
          cParamIdx += 6;
        }
      }
    }

    const climateQuery = `
      INSERT INTO historical_climate (district_id, year, month, avg_temp_c, rainfall_mm, extreme_heat_days)
      VALUES ${climateValueStrings.join(', ')}
      ON CONFLICT (district_id, year, month) DO UPDATE
      SET avg_temp_c = EXCLUDED.avg_temp_c,
          rainfall_mm = EXCLUDED.rainfall_mm,
          extreme_heat_days = EXCLUDED.extreme_heat_days;
    `;
    await client.query(climateQuery, climateValues);
    console.log(`✅ Bulk-inserted ${climateValueStrings.length} monthly climate records.`);

    // 5. Seed Shelters
    console.log('🏠 Seeding Evacuation & Relief Shelters...');
    await client.query('DELETE FROM shelters;');

    const shelterValues = [];
    const shelterValueStrings = [];
    let sParamIdx = 1;

    for (const s of SHELTERS) {
      const dId = districtMap[s.districtName] || null;
      shelterValueStrings.push(`($${sParamIdx}, $${sParamIdx + 1}, $${sParamIdx + 2}, $${sParamIdx + 3}, $${sParamIdx + 4}, $${sParamIdx + 5}, $${sParamIdx + 6})`);
      shelterValues.push(dId, s.name, s.capacity, s.current_occupancy, s.lat, s.lon, s.contact_phone);
      sParamIdx += 7;
    }

    const shelterQuery = `
      INSERT INTO shelters (district_id, name, capacity, current_occupancy, lat, lon, contact_phone)
      VALUES ${shelterValueStrings.join(', ')};
    `;
    await client.query(shelterQuery, shelterValues);
    console.log(`✅ Seeded ${SHELTERS.length} emergency evacuation shelters.`);

    // 6. Seed Sample Citizen Reports with Verification Status
    const citizenUserRes = await client.query("SELECT id FROM users WHERE email = 'darika.citizen@gmail.com';");
    const citizenUserId = citizenUserRes.rows[0]?.id || null;

    await client.query(`
      INSERT INTO citizen_reports (user_id, district, hazard_type, description, image_url, reported_lat, reported_lon, lat, lon, status)
      VALUES 
      (${citizenUserId || 'NULL'}, 'Chennai', 'Severe Inundation', 'Velachery main road flooded under 3ft water after heavy monsoonal rain.', 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500', 12.9815, 80.2180, 12.9815, 80.2180, 'PENDING_REVIEW'),
      (${citizenUserId || 'NULL'}, 'Thoothukudi', 'Road Impassable', 'Submerged port access road near VOC terminal due to high tide storm surge.', 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500', 8.7580, 78.1420, 8.7580, 78.1420, 'VERIFIED_ACTIVE'),
      (${citizenUserId || 'NULL'}, 'Madurai', 'Fallen Power Line', 'High voltage transformer line snapped near Arapalayam bus stand.', NULL, 9.9380, 78.1060, 9.9380, 78.1060, 'PENDING_REVIEW')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Seeded sample citizen incident reports with verification state.');

    await client.query('COMMIT');
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 Enterprise ClimaShield TN Database Seeding Completed Successfully in ${duration}s!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('🔴 Seeding Transaction Failed & Rolled Back:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed()
    .then(() => pool.end().then(() => process.exit(0)))
    .catch((err) => pool.end().then(() => process.exit(1)));
}

module.exports = { seed };
