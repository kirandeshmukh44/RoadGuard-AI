import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = resolve(projectRoot, 'backend');
const windowsPython = resolve(backendDir, 'venv', 'Scripts', 'python.exe');
const unixPython = resolve(backendDir, 'venv', 'bin', 'python');
const python = process.env.PYTHON || (existsSync(windowsPython) ? windowsPython : existsSync(unixPython) ? unixPython : (process.platform === 'win32' ? 'python' : 'python3'));
const backend = spawn(python, ['main.py'], { cwd: backendDir, stdio: 'inherit' });

backend.on('error', (error) => {
  console.error(`Could not start the backend: ${error.message}`);
  process.exitCode = 1;
});
backend.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => backend.kill());
}
