import { getPool } from '../init';
import { v4 as uuidv4 } from 'uuid';

export enum JobStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Job {
  id: string;
  scriptKey: string;
  scriptPath: string;
  scriptLang: string;
  status: JobStatus;
  params?: Record<string, unknown>;
  env?: Record<string, string>;
  dryRun: boolean;
  token: string;
  callbackUrl?: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
}

export interface CreateJobInput {
  scriptKey: string;
  scriptPath: string;
  scriptLang: string;
  params?: Record<string, unknown>;
  env?: Record<string, string>;
  dryRun?: boolean;
  token: string;
  callbackUrl?: string;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const pool = getPool();
  const id = uuidv4();

  const result = await pool.query(
    `
    INSERT INTO jobs (id, script_key, script_path, script_lang, params, env, dry_run, token, callback_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [
      id,
      input.scriptKey,
      input.scriptPath,
      input.scriptLang,
      JSON.stringify(input.params || {}),
      JSON.stringify(input.env || {}),
      input.dryRun || false,
      input.token,
      input.callbackUrl,
    ]
  );

  return mapRowToJob(result.rows[0]);
}

export async function getJob(id: string): Promise<Job | null> {
  const pool = getPool();

  const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToJob(result.rows[0]);
}

export async function updateJob(
  id: string,
  updates: Partial<Job>
): Promise<Job> {
  const pool = getPool();

  const fields: string[] = [];
  const values: unknown[] = [id];
  let paramIndex = 2;

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.exitCode !== undefined) {
    fields.push(`exit_code = $${paramIndex++}`);
    values.push(updates.exitCode);
  }
  if (updates.stdout !== undefined) {
    fields.push(`stdout = $${paramIndex++}`);
    values.push(updates.stdout);
  }
  if (updates.stderr !== undefined) {
    fields.push(`stderr = $${paramIndex++}`);
    values.push(updates.stderr);
  }
  if (updates.startedAt !== undefined) {
    fields.push(`started_at = $${paramIndex++}`);
    values.push(updates.startedAt);
  }
  if (updates.completedAt !== undefined) {
    fields.push(`completed_at = $${paramIndex++}`);
    values.push(updates.completedAt);
  }
  if (updates.durationMs !== undefined) {
    fields.push(`duration_ms = $${paramIndex++}`);
    values.push(updates.durationMs);
  }

  if (fields.length === 0) {
    const job = await getJob(id);
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }
    return job;
  }

  const query = `UPDATE jobs SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, values);

  return mapRowToJob(result.rows[0]);
}

export async function listJobs(
  limit: number = 50,
  offset: number = 0
): Promise<{ jobs: Job[]; total: number }> {
  const pool = getPool();

  const countResult = await pool.query('SELECT COUNT(*) FROM jobs');
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    'SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  return {
    jobs: result.rows.map(mapRowToJob),
    total,
  };
}

function mapRowToJob(row: any): Job {
  return {
    id: row.id,
    scriptKey: row.script_key,
    scriptPath: row.script_path,
    scriptLang: row.script_lang,
    status: row.status as JobStatus,
    params: row.params ? JSON.parse(row.params) : undefined,
    env: row.env ? JSON.parse(row.env) : undefined,
    dryRun: row.dry_run,
    token: row.token,
    callbackUrl: row.callback_url,
    exitCode: row.exit_code,
    stdout: row.stdout,
    stderr: row.stderr,
    createdAt: new Date(row.created_at),
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    durationMs: row.duration_ms,
  };
}

