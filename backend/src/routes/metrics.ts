import { FastifyInstance } from 'fastify';

// Simple in-memory metrics (in production, use Prometheus client)
let metricsData = {
  jobsCompleted: 0,
  jobsFailed: 0,
  jobsQueued: 0,
  totalDurationMs: 0,
  activeJobs: 0,
  requestsTotal: 0,
};

export function recordJobCompleted(durationMs: number) {
  metricsData.jobsCompleted++;
  metricsData.totalDurationMs += durationMs;
}

export function recordJobFailed() {
  metricsData.jobsFailed++;
}

export function recordJobQueued() {
  metricsData.jobsQueued++;
}

export function recordActiveJob(delta: number) {
  metricsData.activeJobs += delta;
}

export function recordRequest() {
  metricsData.requestsTotal++;
}

export async function metricsRoutes(app: FastifyInstance) {
  app.get('/metrics', async (request, reply) => {
    const avgDurationMs = metricsData.jobsCompleted > 0
      ? Math.round(metricsData.totalDurationMs / metricsData.jobsCompleted)
      : 0;

    return {
      jobs: {
        completed: metricsData.jobsCompleted,
        failed: metricsData.jobsFailed,
        queued: metricsData.jobsQueued,
        active: metricsData.activeJobs,
        successRate:
          metricsData.jobsCompleted + metricsData.jobsFailed > 0
            ? (metricsData.jobsCompleted / (metricsData.jobsCompleted + metricsData.jobsFailed)) * 100
            : 0,
      },
      performance: {
        avgDurationMs,
        totalDurationMs: metricsData.totalDurationMs,
      },
      requests: {
        total: metricsData.requestsTotal,
      },
      timestamp: new Date().toISOString(),
    };
  });
}

