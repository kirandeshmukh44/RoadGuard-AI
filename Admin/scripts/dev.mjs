import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = resolve(root, 'backend');
const frontendDir = resolve(root, 'frontend');
const python = resolve(backendDir, 'venv', 'Scripts', 'python.exe');
const vite = resolve(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');
const children = [];
let stopping = false;
const startupTimeoutMs = Number(process.env.ADMIN_STARTUP_TIMEOUT_MS || 30_000);

function start(name, command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' && command === 'npm' });
  children.push(child);
  child.on('error', (error) => {
    console.error(`[${name}] ${error.message}`);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    if (stopping) return;
    if (code !== 0 || signal) {
      console.error(`[${name}] stopped${signal ? ` (${signal})` : ` with exit code ${code}`}.`);
      stop(code || 1);
    }
  });
  return child;
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (process.platform === 'win32' && child.pid) {
      spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
  process.exitCode = code;
}

function waitForExit(child) {
  return new Promise((resolveExit) => child.once('exit', resolveExit));
}

async function waitForHealth(name, url, child) {
  const deadline = Date.now() + startupTimeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${name} exited with code ${child.exitCode} before becoming ready.`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  }
  throw new Error(`${name} did not become ready at ${url} within ${startupTimeoutMs / 1000}s${lastError ? ` (${lastError.message})` : ''}.`);
}

async function isPortAvailable(port) {
  return new Promise((resolvePort) => {
    const server = createServer();
    server.once('error', () => resolvePort(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolvePort(true)));
  });
}

async function isHealthyService(url, validate) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return response.ok && await validate(response);
  } catch {
    return false;
  }
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

if (!existsSync(python)) {
  console.error('Admin backend environment is missing. Create it with `py -m venv backend/venv` and install `backend/requirements.txt`.');
  process.exit(1);
}
if (!existsSync(vite)) {
  console.error('Admin frontend dependencies are missing. Run `npm install --prefix frontend`.');
  process.exit(1);
}

const apiPort = Number(process.env.ADMIN_API_PORT || 8006);
const frontendPort = Number(process.env.ADMIN_FRONTEND_PORT || 5175);
let backendChild;
let frontendChild;

if (await isPortAvailable(apiPort)) {
  backendChild = start('backend', python, ['main.py'], backendDir);
} else if (await isHealthyService(`http://127.0.0.1:${apiPort}/api/admin/health`, async (response) => {
  const body = await response.json();
  return body.service === 'Dedicated Admin Backend' && body.status === 'healthy';
})) {
  console.log(`Admin API already running: http://127.0.0.1:${apiPort}`);
} else {
  console.error(`Port ${apiPort} is occupied by another service, not the Admin API.`);
  process.exit(1);
}

if (await isPortAvailable(frontendPort)) {
  frontendChild = start('frontend', process.execPath, [vite, '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'], frontendDir);
} else if (await isHealthyService(`http://127.0.0.1:${frontendPort}/`, async (response) => {
  const html = await response.text();
  return html.includes('<title>AI Road Guardian - Admin Control Center</title>');
})) {
  console.log(`Admin frontend already running: http://127.0.0.1:${frontendPort}`);
} else {
  console.error(`Port ${frontendPort} is occupied by another service, not the Admin frontend.`);
  stop(1);
  await Promise.all(children.map(waitForExit));
  process.exit(1);
}

try {
  if (backendChild) {
    await waitForHealth('Admin API', `http://127.0.0.1:${apiPort}/api/admin/health`, backendChild);
    console.log(`Admin API ready: http://127.0.0.1:${apiPort}`);
  }
  if (frontendChild) {
    await waitForHealth('Admin frontend', `http://127.0.0.1:${frontendPort}/`, frontendChild);
    console.log(`Admin frontend ready: http://127.0.0.1:${frontendPort}`);
  }
} catch (error) {
  console.error(error.message);
  stop(1);
  await Promise.all(children.map(waitForExit));
  process.exit(1);
}

console.log(`Admin portal: http://127.0.0.1:${frontendPort}`);
console.log(`Admin API:    http://127.0.0.1:${apiPort}`);

if (children.length === 0) {
  console.log('Both Admin services are already running. You can use the portal now.');
  process.exit(0);
}

await new Promise((resolveWait) => {
  const timer = setInterval(() => {
    if (stopping || children.every(({ exitCode }) => exitCode !== null)) {
      clearInterval(timer);
      resolveWait();
    }
  }, 250);
});
