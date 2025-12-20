import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export interface RunnerOptions {
  jobId: string;
  scriptPath: string;
  scriptLang: 'javascript' | 'python' | 'bash';
  params: Record<string, unknown>;
  env?: Record<string, string>;
  dryRun?: boolean;
  timeoutMs?: number;
}

export interface RunnerResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

// Sanitize path: ensure it doesn't escape the allowed directories
function sanitizePath(inputPath: string): string {
  const resolved = path.resolve(inputPath);
  const realPath = path.resolve(process.cwd(), inputPath);

  // Whitelist check: only allow paths under project root or /tmp
  const projectRoot = path.resolve(process.cwd());
  const tmpRoot = path.resolve(os.tmpdir());

  if (
    !realPath.startsWith(projectRoot) &&
    !realPath.startsWith(tmpRoot)
  ) {
    throw new Error(`Access denied: path '${inputPath}' is outside whitelist`);
  }

  return realPath;
}

// Build command and arguments for the interpreter
function buildCommand(
  scriptPath: string,
  scriptLang: string,
  params: Record<string, unknown>
): { cmd: string; args: string[] } {
  const sanitized = sanitizePath(scriptPath);

  // Convert params to command-line arguments
  const args: string[] = [sanitized];

  // Only add positional arguments for scripts that expect them
  // For our scripts: generate.js expects domain and numRecords
  if (params && typeof params === 'object') {
    // Add params as named arguments or positional args depending on script
    const paramValues = Object.values(params)
      .map((v) => String(v))
      .filter(Boolean);
    args.push(...paramValues);
  }

  let cmd: string;
  switch (scriptLang) {
    case 'javascript':
      cmd = 'node';
      break;
    case 'python':
      cmd = 'python3';
      break;
    case 'bash':
      cmd = 'bash';
      break;
    default:
      throw new Error(`Unsupported script language: ${scriptLang}`);
  }

  return { cmd, args };
}

// Create isolated temp directory for job
function createJobDir(): string {
  const jobDir = path.join(os.tmpdir(), 'gadmin-toolkit-jobs', uuidv4());
  fs.mkdirSync(jobDir, { recursive: true });
  return jobDir;
}

// Clean up job directory
function cleanupJobDir(jobDir: string): void {
  try {
    if (fs.existsSync(jobDir)) {
      fs.rmSync(jobDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Failed to cleanup job dir ${jobDir}:`, error);
  }
}

class GenericRunner {
  async run(options: RunnerOptions): Promise<RunnerResult> {
    const startTime = Date.now();
    const { cmd, args } = buildCommand(
      options.scriptPath,
      options.scriptLang,
      options.params
    );

    // Create isolated job directory
    const jobDir = createJobDir();

    try {
      // If dryRun, just validate and return simulated output
      if (options.dryRun) {
        return {
          exitCode: 0,
          stdout: `[DRY RUN] Would execute: ${cmd} ${args.join(' ')}\n[DRY RUN] Params: ${JSON.stringify(options.params)}`,
          stderr: '',
          durationMs: Date.now() - startTime,
        };
      }

      // Prepare environment variables
      const processEnv = {
        ...process.env,
        ...options.env,
        GADMIN_JOB_ID: options.jobId,
        GADMIN_JOB_DIR: jobDir,
      };

      return await new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        // Spawn process without shell (security: no injection)
        const proc = spawn(cmd, args, {
          cwd: jobDir,
          env: processEnv,
          shell: false, // CRITICAL: no shell interpolation
          timeout: options.timeoutMs || 300000, // Default 5 min
        });

        // Collect stdout
        proc.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        // Collect stderr
        proc.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        // Handle timeout
        const timeoutId = setTimeout(() => {
          timedOut = true;
          proc.kill('SIGKILL');
        }, options.timeoutMs || 300000);

        proc.on('close', (code) => {
          clearTimeout(timeoutId);

          if (timedOut) {
            resolve({
              exitCode: 124, // Standard timeout exit code
              stdout,
              stderr: stderr + '\n[RUNNER] Job exceeded timeout',
              durationMs: Date.now() - startTime,
            });
          } else {
            resolve({
              exitCode: code || 0,
              stdout,
              stderr,
              durationMs: Date.now() - startTime,
            });
          }
        });

        proc.on('error', (error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
      });
    } finally {
      // Always cleanup job directory
      cleanupJobDir(jobDir);
    }
  }
}

// Export singleton instance
export const genericRunner = new GenericRunner();

