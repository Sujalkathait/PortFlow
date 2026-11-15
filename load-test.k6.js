import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * PortFlow High-Performance k6 Load & Stress Benchmark
 *
 * Simulates gradual realistic user ramp-up across all specified tiers:
 *   50 → 100 → 250 → 500 → 1000 → 3000 VUs
 *
 * Targets:
 *   - HTTP failures: < 1%
 *   - Overall HTTP p95: < 1000ms
 *   - Health API p95: < 500ms
 *   - GraphQL p95: < 1000ms
 */

export const options = {
  stages: [
    { duration: '10s', target: 50 },    // Tier 1: 50 concurrent VUs
    { duration: '15s', target: 100 },   // Tier 2: 100 concurrent VUs
    { duration: '15s', target: 250 },   // Tier 3: 250 concurrent VUs
    { duration: '20s', target: 500 },   // Tier 4: 500 concurrent VUs
    { duration: '20s', target: 1000 },  // Tier 5: 1000 concurrent VUs
    { duration: '30s', target: 3000 },  // Tier 6: 3000 peak concurrent VUs
    { duration: '10s', target: 0 },     // Ramp-down
  ],
  thresholds: {
    // Overall HTTP failures must be below 1%
    http_req_failed: ['rate<0.01'],
    // Overall 95th percentile latency must be under 1000ms
    http_req_duration: ['p(95)<1000'],
    // Health API 95th percentile must be under 500ms
    'http_req_duration{name:health}': ['p(95)<500'],
    // GraphQL 95th percentile must be under 1000ms
    'http_req_duration{name:graphql}': ['p(95)<1000'],
  },
  noConnectionReuse: false,
};

const BASE_URL = __ENV.TARGET_URL || 'http://127.0.0.1:10000';

export default function () {
  // 1. Health endpoint — lightweight non-blocking heartbeat probe
  const healthRes = http.get(`${BASE_URL}/health`, {
    headers: {
      'User-Agent': 'PortFlow-k6-LoadTest/1.0',
      'Connection': 'keep-alive',
      'Accept': 'application/json',
    },
    tags: { name: 'health' },
  });

  check(healthRes, {
    'health check returns 200': (r) => r.status === 200,
    'health latency < 500ms': (r) => r.timings.duration < 500,
  });

  // 2. GraphQL query — high-concurrency API responsiveness
  const gqlPayload = JSON.stringify({
    query: `query { __typename }`,
  });

  const gqlRes = http.post(`${BASE_URL}/graphql`, gqlPayload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'PortFlow-k6-LoadTest/1.0',
      'Connection': 'keep-alive',
      'Accept': 'application/json',
    },
    tags: { name: 'graphql' },
  });

  check(gqlRes, {
    'graphql endpoint returns 200': (r) => r.status === 200,
    'graphql latency < 1000ms': (r) => r.timings.duration < 1000,
  });

  // Human think-time jitter: 0.2s - 1.0s
  sleep(Math.random() * 0.8 + 0.2);
}
