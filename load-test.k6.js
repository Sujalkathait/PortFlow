import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * PortFlow Grafana k6 Load & Stress Benchmark
 *
 * Simulates realistic user ramp-up (50 → 500 → 3000 VUs) hitting PortFlow
 * REST Health, REST API, and Apollo GraphQL endpoints.
 *
 * Run:
 *   k6 run load-test.k6.js
 *
 * Override target (e.g., deployed instance on Render):
 *   k6 run -e TARGET_URL=https://your-backend.onrender.com load-test.k6.js
 *
 * Disable rate limiting on the backend during testing:
 *   Set DISABLE_RATE_LIMIT=true or LOAD_TEST=true in backend/.env
 */

export const options = {
  stages: [
    { duration: '30s', target: 50 },    // Warm-up: 50 concurrent users
    { duration: '30s', target: 200 },   // Light load: 200 concurrent users
    { duration: '30s', target: 500 },   // Moderate load: 500 concurrent users
    { duration: '30s', target: 1000 },  // Heavy load: 1000 concurrent users
    { duration: '60s', target: 3000 },  // Max stress: 3000 concurrent users
    { duration: '20s', target: 0 },     // Cool down
  ],
  thresholds: {
    // 95% of requests must complete under 1000ms at max load
    http_req_duration: ['p(95)<1000'],
    // Less than 2% failed requests allowed at 3000 VUs
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:10000';

export default function () {
  // 1. Health endpoint — lightweight DB + server connectivity probe
  const healthRes = http.get(`${BASE_URL}/health`, {
    headers: { 'User-Agent': 'PortFlow-k6-LoadTest/1.0' },
  });
  check(healthRes, {
    'health check returns 200': (r) => r.status === 200,
    'database is connected': (r) => {
      try {
        return JSON.parse(r.body).databaseConnected === true;
      } catch (_) {
        return false;
      }
    },
    'health latency < 500ms': (r) => r.timings.duration < 500,
  });

  // 2. GraphQL introspection — validates the dual-engine API is responsive
  const gqlPayload = JSON.stringify({
    query: `query { __typename }`,
  });

  const gqlRes = http.post(`${BASE_URL}/graphql`, gqlPayload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'PortFlow-k6-LoadTest/1.0',
    },
  });

  check(gqlRes, {
    'graphql endpoint returns 200': (r) => r.status === 200,
    'graphql latency < 1000ms': (r) => r.timings.duration < 1000,
  });

  // Realistic human think-time: 0.5–2.5 seconds between actions
  sleep(Math.random() * 2 + 0.5);
}
