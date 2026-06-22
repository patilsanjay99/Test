// Root entrypoint for Cloud Hosting Panels (e.g. cPanel, Plesk, Phusion Passenger, PM2, Heroku, Render)
// This file bootstrap-loads the compiled, ultra-optimized single-file Express server inside /dist.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '3000';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const compiledServerJs = path.join(__dirname, 'dist', 'server.js');
const compiledServerCjs = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(compiledServerCjs)) {
  console.log('🚀 Loading compiled production server (CJS) from:', compiledServerCjs);
  require('./dist/server.cjs');
} else if (fs.existsSync(compiledServerJs)) {
  console.log('🚀 Loading compiled production server (ESM) from:', compiledServerJs);
  import('./dist/server.js').catch(err => {
    console.error('❌ Failed to dynamically import ./dist/server.js:', err);
    process.exit(1);
  });
} else {
  console.error('\n❌ ERROR: Compiled server bundle not found at ./dist/server.js or ./dist/server.cjs');
  console.error('👉 Did you forget to build the application first? Run: npm run build\n');
  process.exit(1);
}

