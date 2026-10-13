const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

jest.setTimeout(20000);

describe('ClimaShield TN Backend Integration API Suite', () => {

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/health - API Health Check', () => {
    it('should return 200 OK with health status payload', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'ClimaShield TN API');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/v1/system/status - Data Seed & System Status Verification', () => {
    it('should return 200 OK, isSeeded true, and valid database counts', async () => {
      const response = await request(app).get('/api/v1/system/status');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isSeeded).toBe(true);
      expect(response.body.database).toBe('Connected');
      expect(response.body.counts).toBeDefined();
      expect(response.body.counts.districts).toBeGreaterThanOrEqual(8);
      expect(response.body.counts.historical_climate).toBeGreaterThanOrEqual(3360);
      expect(response.body.counts.shelters).toBeGreaterThanOrEqual(5);
    });
  });

  describe('GET /api/v1/climate/historical - Historical Climate Time Series', () => {
    it('should return 200 OK and yearly aggregated climate metrics for Chennai', async () => {
      const response = await request(app)
        .get('/api/v1/climate/historical?district=Chennai&start_year=1990&end_year=2024');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      response.body.data.forEach((item) => {
        expect(item).toHaveProperty('year');
        expect(item).toHaveProperty('mean_temp');
        expect(item).toHaveProperty('total_rainfall');
        expect(typeof item.year).toBe('number');
        expect(typeof item.mean_temp).toBe('number');
        expect(typeof item.total_rainfall).toBe('number');
      });
    });
  });

  describe('GET /api/v1/shelters/nearby - PostGIS Geodesic Proximity Query', () => {
    it('should return 200 OK and array of shelters with numeric distance_km', async () => {
      const response = await request(app)
        .get('/api/v1/shelters/nearby?lat=13.0827&lon=80.2707&radius_km=25');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      response.body.data.forEach((shelter) => {
        expect(shelter).toHaveProperty('name');
        expect(shelter).toHaveProperty('capacity');
        expect(shelter).toHaveProperty('distance_km');
        expect(typeof shelter.name).toBe('string');
        expect(typeof shelter.capacity).toBe('number');
        expect(typeof shelter.distance_km).toBe('number');
      });
    });

    it('should return 400 Bad Request when lat or lon query parameters are missing', async () => {
      const response = await request(app).get('/api/v1/shelters/nearby');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });
  });
});
