import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = resolve(projectRoot, 'frontend');
const backendDir = resolve(projectRoot, 'backend');

if (!existsSync(resolve(frontendDir, 'node_modules'))) {
  console.error('Frontend dependencies are missing. Run `npm install --prefix frontend` first.');
  process.exit(1);
}

const windowsPython = resolve(backendDir, 'venv', 'Scripts', 'python.exe');
const unixPython = resolve(backendDir, 'venv', 'bin', 'python');
const python = process.env.PYTHON || (existsSync(windowsPython) ? windowsPython : existsSync(unixPython) ? unixPython : (process.platform === 'win32' ? 'python' : 'python3'));
const processes = [];
let stopping = false;
let apiPort;
let frontendPort;

async function isPortAvailable(port) {
  return new Promise((resolvePort) => {
    const server = createServer();
    server.once('error', () => resolvePort(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolvePort(true)));
  });
}

async function findAvailablePort(startPort, excluded = new Set()) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (excluded.has(port)) continue;
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No free API port found between ${startPort} and ${startPort + 19}.`);
}

function startService(name, command, args, cwd, options = {}) {
  const child = spawn(command, args, { cwd, stdio: name === 'backend' ? ['inherit', 'pipe', 'pipe'] : 'inherit', ...options });
  processes.push({ name, child });
  if (name === 'backend') {
    child.stdout.on('data', (chunk) => {
      const output = chunk.toString();
      lastBackendOutput = `${lastBackendOutput}${output}`.slice(-4000);
      process.stdout.write(output);
    });
    child.stderr.on('data', (chunk) => {
      const output = chunk.toString();
      lastBackendOutput = `${lastBackendOutput}${output}`.slice(-4000);
      process.stderr.write(output);
    });
  }
  child.on('error', (error) => {
    console.error(`[${name}] Could not start: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    if (stopping) return;
    if (name === 'backend' && code !== 0 && !signal && /winerror 10048|address already in use|address\(s\) already in use|eaddrinuse/i.test(lastBackendOutput)) {
      retryBackendOnAnotherPort();
      return;
    }
    console.error(`[${name}] stopped${signal ? ` (${signal})` : ` with exit code ${code ?? 1}`}.`);
    stop(code && code !== 0 ? code : 1);
  });
  return child;
}

let lastBackendOutput = '';
let requestedApiPort = 8003;
let backendRestartCount = 0;

async function retryBackendOnAnotherPort() {
  const previousPort = apiPort;
  backendRestartCount += 1;
  if (backendRestartCount > 5) {
    console.error('The backend could not bind after 5 port retries. Check whether another process is occupying the API ports.');
    stop(1);
    return;
  }
  const unavailablePorts = new Set([frontendPort]);
  for (let port = requestedApiPort; port <= previousPort; port += 1) unavailablePorts.add(port);
  try {
    apiPort = await findAvailablePort(previousPort + 1, unavailablePorts);
  } catch (error) {
    console.error(error.message);
    stop(1);
    return;
  }
  console.warn(`[backend] Port ${previousPort} was claimed before the API could bind. Retrying on ${apiPort}.`);
  console.log(`Backend:  http://localhost:${apiPort}  (API docs: /docs)`);
  startBackend();
}

function startBackend() {
  lastBackendOutput = '';
  startService('backend', python, ['main.py'], backendDir, { env: { ...process.env, API_PORT: String(apiPort), FRONTEND_ORIGIN: `http://127.0.0.1:${frontendPort}` } });
}

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const { child } of processes) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

try {
  frontendPort = await findAvailablePort(Number(process.env.FRONTEND_PORT || 5173));
  requestedApiPort = Number(process.env.API_PORT || 8003);
  apiPort = await findAvailablePort(requestedApiPort, new Set([frontendPort]));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

console.log('RoadGuard AI development services');
console.log(`Frontend: http://127.0.0.1:${frontendPort}`);
console.log(`Backend:  http://localhost:${apiPort}  (API docs: /docs)`);
console.log('SQLite:   backend/road_monitoring.db');
console.log('Dataset:  backend/Dataset from kaggle');

const viteCli = resolve(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(viteCli)) {
  console.error('Vite is missing. Run `npm install --prefix frontend` first.');
  process.exit(1);
}
startService('frontend', process.execPath, [viteCli, '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'], frontendDir, { env: { ...process.env, API_PORT: String(apiPort), VITE_API_URL: '' } });

startBackend();
