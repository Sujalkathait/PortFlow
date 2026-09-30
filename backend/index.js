/**
 * PortFlow Backend - Main Application Entrypoint
 *
 * Production (Render):
 *   Executes the compiled JavaScript bundle located at './dist/index.js' (built via 'npm run build').
 *   This is the entrypoint invoked by 'npm start' -> 'node index.js'.
 *
 * Development Fallback:
 *   If running directly in development without a pre-compiled './dist/index.js',
 *   automatically registers ts-node and executes './src/index.ts'.
 */

const fs = require('fs');
const path = require('path');

const distEntry = path.join(__dirname, 'dist', 'index.js');
const srcEntry = path.join(__dirname, 'src', 'index.ts');

if (fs.existsSync(distEntry)) {
  module.exports = require(distEntry);
} else {
  try {
    require('ts-node/register');
    module.exports = require(srcEntry);
  } catch (err) {
    console.error('[PortFlow Startup Error] Failed to initialize backend server:');
    console.error('Neither compiled output (./dist/index.js) nor ts-node could be loaded.');
    console.error('Please run "npm run build" to compile the TypeScript source.');
    console.error(err);
    process.exit(1);
  }
}
