#!/usr/bin/env node
/**
 * PortFlow High-Performance HTTP Concurrency Load Tester
 *
 * Benchmark concurrent user capacity, throughput (req/sec), latency distribution
 * (p50, p95, p99), and error rates — tested up to 3,000 simultaneous connections.
 *
 * Usage examples:
 *   node backend/scripts/load-test.js
 *   node backend/scripts/load-test.js --concurrency 500 --duration 20
 *   node backend/scripts/load-test.js --concurrency 3000 --duration 60 --url http://localhost:10000/health
 *
 * NOTE: For 3000-user tests set DISABLE_RATE_LIMIT=true in backend/.env
 */

const http = require('http');
const https = require('https');
const urlModule = require('url');

// ---- Parse CLI arguments ----
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
    return defaultValue;
}

const TARGET_URL  = getArg('--url', process.env.TEST_URL || 'http://localhost:10000/health');
const CONCURRENCY = parseInt(getArg('--concurrency', '50'), 10);
const DURATION_S  = parseInt(getArg('--duration', '10'), 10);

// ---- Validation ----
if (CONCURRENCY > 10000) {
    console.error('ERROR: Concurrency > 10 000 is not supported. Use k6 for extreme loads.');
    process.exit(1);
}

console.log('='.repeat(65));
console.log('  \u26f3 PortFlow Concurrency & User Load Tester');
console.log('='.repeat(65));
console.log(` Target Endpoint : ${TARGET_URL}`);
console.log(` Concurrency     : ${CONCURRENCY} simultaneous connections`);
console.log(` Duration        : ${DURATION_S} seconds`);
if (CONCURRENCY >= 1000) {
    console.log(' \u26a0\ufe0f  HIGH CONCURRENCY: Ensure backend has DISABLE_RATE_LIMIT=true');
}
console.log('='.repeat(65));
console.log('Running test\u2026 Please wait.\n');

// ---- HTTP Client Setup ----
const parsedUrl = urlModule.parse(TARGET_URL);
const isHttps   = parsedUrl.protocol === 'https:';
const client    = isHttps ? https : http;

// Increase max sockets dynamically based on concurrency
const agent = new client.Agent({
    keepAlive        : true,
    keepAliveMsecs   : 1000,
    maxSockets       : CONCURRENCY + 100,
    maxFreeSockets   : Math.min(CONCURRENCY, 256),
    timeout          : 30000,
});

// ---- State tracking ----
let totalRequests   = 0;
let successRequests = 0;
let failedRequests  = 0;
let activeRequests  = 0;
const statusCodes   = {};
const latencies     = [];
let isRunning       = true;

const startTime = Date.now();
const endTime   = startTime + DURATION_S * 1000;

// ---- Per-request function ----
function sendRequest() {
    if (!isRunning) return;
    if (activeRequests >= CONCURRENCY) return;

    activeRequests++;
    const reqStart = process.hrtime.bigint();

    const req = client.request({
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port    : parsedUrl.port || (isHttps ? 443 : 80),
        path    : parsedUrl.path || '/',
        method  : 'GET',
        agent,
        headers : {
            'User-Agent' : 'PortFlow-LoadTester/2.0',
            'Connection' : 'keep-alive',
        },
    }, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
            const latencyMs = Number(process.hrtime.bigint() - reqStart) / 1e6;
            totalRequests++;
            activeRequests--;
            latencies.push(latencyMs);
            statusCodes[res.statusCode] = (statusCodes[res.statusCode] || 0) + 1;

            if (res.statusCode >= 200 && res.statusCode < 400) {
                successRequests++;
            } else {
                failedRequests++;
            }

            if (Date.now() < endTime && isRunning) {
                setImmediate(sendRequest);
            }
        });
    });

    req.on('error', () => {
        activeRequests--;
        totalRequests++;
        failedRequests++;
        statusCodes['ERR'] = (statusCodes['ERR'] || 0) + 1;

        if (Date.now() < endTime && isRunning) {
            setImmediate(sendRequest);
        }
    });

    req.setTimeout(10000, () => {
        req.destroy();
    });

    req.end();
}

// ---- Print live progress every 5 seconds ----
const progressInterval = setInterval(() => {
    if (!isRunning) return;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const rps = (totalRequests / elapsed || 0).toFixed(0);
    process.stdout.write(
        `\r  \u23f1  [${elapsed}s/${DURATION_S}s] Requests: ${totalRequests} | Active: ${activeRequests} | RPS: ${rps} | Errors: ${failedRequests}  `
    );
}, 1000);

// ---- Start all workers ----
for (let i = 0; i < CONCURRENCY; i++) {
    setImmediate(sendRequest);
}

// ---- Finalize after duration ----
setTimeout(() => {
    isRunning = false;
    clearInterval(progressInterval);
    process.stdout.write('\n\n');

    const actualDurationSec = (Date.now() - startTime) / 1000;
    latencies.sort((a, b) => a - b);

    const percentile = (p) => {
        if (!latencies.length) return 0;
        const idx = Math.ceil((p / 100) * latencies.length) - 1;
        return latencies[Math.max(0, idx)].toFixed(2);
    };

    const avgLatency = latencies.length
        ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)
        : 0;

    const reqPerSec  = (totalRequests / actualDurationSec).toFixed(2);
    const errorRate  = totalRequests > 0 ? ((failedRequests / totalRequests) * 100).toFixed(2) : '0.00';

    console.log('='.repeat(65));
    console.log('  \ud83d\udcca LOAD TEST RESULTS');
    console.log('='.repeat(65));
    console.log(` Concurrency Level         : ${CONCURRENCY} users`);
    console.log(` Total Duration            : ${actualDurationSec.toFixed(1)}s`);
    console.log(` Total Completed Requests  : ${totalRequests}`);
    console.log(` Successful Requests (2xx) : ${successRequests}`);
    console.log(` Failed Requests           : ${failedRequests} (${errorRate}%)`);
    console.log(` Average Throughput        : ${reqPerSec} req/sec`);
    console.log('-'.repeat(65));
    console.log(' \u23f1\ufe0f  LATENCY DISTRIBUTION:');
    console.log(`   Min           : ${latencies[0]?.toFixed(2) ?? 0} ms`);
    console.log(`   Avg           : ${avgLatency} ms`);
    console.log(`   p50 (Median)  : ${percentile(50)} ms`);
    console.log(`   p75           : ${percentile(75)} ms`);
    console.log(`   p90           : ${percentile(90)} ms`);
    console.log(`   p95           : ${percentile(95)} ms`);
    console.log(`   p99           : ${percentile(99)} ms`);
    console.log(`   Max           : ${latencies[latencies.length - 1]?.toFixed(2) ?? 0} ms`);
    console.log('-'.repeat(65));
    console.log(' \ud83d\udd22 STATUS CODE BREAKDOWN:');
    for (const [code, count] of Object.entries(statusCodes)) {
        const pct = ((count / totalRequests) * 100).toFixed(1);
        console.log(`   HTTP ${code}  :  ${count}  (${pct}%)`);
    }
    console.log('='.repeat(65));

    // ---- Capacity verdict ----
    const p95 = Number(percentile(95));
    const err  = Number(errorRate);
    if (err === 0 && p95 < 200) {
        console.log(` \u2705  VERDICT: EXCELLENT  \u2014  ${CONCURRENCY} users served with low latency and zero errors.`);
    } else if (err < 1 && p95 < 500) {
        console.log(` \u26a0\ufe0f  VERDICT: GOOD  \u2014  ${CONCURRENCY} users handled with acceptable latency.`);
    } else if (err < 5 && p95 < 1000) {
        console.log(` \u26a0\ufe0f  VERDICT: DEGRADED  \u2014  Latency is elevated. Approaching server limits.`);
    } else {
        console.log(` \u274c  VERDICT: BOTTLENECK  \u2014  Server is overloaded at ${CONCURRENCY} concurrent users.`);
        console.log('    Recommendations: Enable connection pooler (PgBouncer), run Node in cluster');
        console.log('    mode (PM2: pm2 start dist/index.js -i max), or scale horizontally.');
    }
    console.log('='.repeat(65) + '\n');

    agent.destroy();
    process.exit(0);
}, DURATION_S * 1000);
