import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getScriptMetadata, getAllScripts } from './scripts';
import { validateToken } from './auth';
import { createJob, getJob, updateJob, JobStatus } from '../db/models/job';
import { genericRunner } from '../runner/genericRunner';
import { recordRequest } from './metrics';

const RunScriptRequestSchema = z.object({
  params: z.record(z.unknown()).optional().default({}),
  env: z.record(z.string()).optional().default({}),
  runAsync: z.boolean().optional(),
  dryRun: z.boolean().optional().default(false),
  callbackUrl: z.string().url().optional(),
});

type RunScriptRequest = z.infer<typeof RunScriptRequestSchema>;

export async function jobRoutes(app: FastifyInstance) {
  // GET /api/job/:id - Get job status
  app.get('/:id', async (request, reply) => {
    recordRequest();
    const { id } = request.params as { id: string };

    try {
      const job = await getJob(id);

      if (!job) {
        return reply.status(404).send({
          status: 'error',
          message: 'Job not found',
        });
      }

      return {
        status: 'success',
        job,
      };
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to fetch job',
      });
    }
  });

  // POST /api/run/:scriptKey - Run a script
  app.post<{ Params: { scriptKey: string }; Body: RunScriptRequest }>(
    '../run/:scriptKey',
    async (request, reply) => {
      recordRequest();
      const { scriptKey } = request.params;
      const authHeader = request.headers.authorization;

      // Validate token
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          status: 'error',
          message: 'Missing or invalid Authorization header',
        });
      }

      const token = authHeader.slice(7);
      const { valid, isAdmin } = validateToken(token);

      if (!valid) {
        return reply.status(401).send({
          status: 'error',
          message: 'Invalid token',
        });
      }

      // Validate request body
      let parsedBody: RunScriptRequest;
      try {
        parsedBody = RunScriptRequestSchema.parse(request.body);
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: 'Invalid request parameters',
          details: error instanceof z.ZodError ? error.errors : [],
        });
      }

      // Check if script exists in whitelist
      const scriptMetadata = getScriptMetadata(scriptKey);
      if (!scriptMetadata) {
        return reply.status(403).send({
          status: 'error',
          message: `Script '${scriptKey}' not found in whitelist`,
        });
      }

      // Check admin-only scripts
      if (scriptMetadata.adminOnly && !isAdmin) {
        return reply.status(403).send({
          status: 'error',
          message: 'This script requires admin privileges',
        });
      }

      // Determine run mode (allow override via request)
      const runAsync =
        parsedBody.runAsync !== undefined
          ? parsedBody.runAsync
          : scriptMetadata.defaultRunMode === 'async';

      try {
        if (runAsync) {
          // Async: queue the job
          const job = await createJob({
            scriptKey,
            scriptPath: scriptMetadata.path,
            scriptLang: scriptMetadata.lang,
            params: parsedBody.params || {},
            env: parsedBody.env || {},
            dryRun: parsedBody.dryRun || false,
            token: token.slice(0, 20) + '...',
            callbackUrl: parsedBody.callbackUrl,
          });

          // TODO: Queue job in BullMQ
          return {
            status: 'queued',
            jobId: job.id,
            queuedAt: job.createdAt,
          };
        } else {
          // Sync: run immediately
          const job = await createJob({
            scriptKey,
            scriptPath: scriptMetadata.path,
            scriptLang: scriptMetadata.lang,
            params: parsedBody.params || {},
            env: parsedBody.env || {},
            dryRun: parsedBody.dryRun || false,
            token: token.slice(0, 20) + '...',
          });

          // Run the script
          const result = await genericRunner.run({
            jobId: job.id,
            scriptPath: scriptMetadata.path,
            scriptLang: scriptMetadata.lang,
            params: parsedBody.params || {},
            env: parsedBody.env || {},
            dryRun: parsedBody.dryRun || false,
            timeoutMs: scriptMetadata.timeoutMs,
          });

          // Update job with result
          await updateJob(job.id, {
            status: result.exitCode === 0 ? JobStatus.COMPLETED : JobStatus.FAILED,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            completedAt: new Date(),
          });

          if (result.exitCode === 0) {
            return {
              status: 'success',
              exitCode: result.exitCode,
              stdout: result.stdout,
              stderr: result.stderr,
              durationMs: result.durationMs,
              jobId: job.id,
            };
          } else {
            return reply.status(400).send({
              status: 'error',
              exitCode: result.exitCode,
              stdout: result.stdout,
              stderr: result.stderr,
              durationMs: result.durationMs,
              jobId: job.id,
            });
          }
        }
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          status: 'error',
          message: 'Failed to run script',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}

