import { FastifyInstance } from 'fastify';

export async function authRoutes(app: FastifyInstance) {
  // Validate token (simple check against API_TOKENS env var)
  app.post('/validate', async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        status: 'error',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.slice(7);
    const validTokens = (process.env.API_TOKENS || '')
      .split(' ')
      .filter(Boolean);

    const isValid = validTokens.includes(token);

    if (!isValid) {
      return reply.status(401).send({
        status: 'error',
        message: 'Invalid token',
      });
    }

    // Check if admin token
    const adminTokens = (process.env.ADMIN_TOKENS || '')
      .split(' ')
      .filter(Boolean);
    const isAdmin = adminTokens.includes(token);

    return {
      status: 'success',
      valid: true,
      isAdmin,
      token: token.slice(0, 20) + '...',
    };
  });
}

export function validateToken(token: string): {
  valid: boolean;
  isAdmin: boolean;
} {
  const validTokens = (process.env.API_TOKENS || '')
    .split(' ')
    .filter(Boolean);

  if (!validTokens.includes(token)) {
    return { valid: false, isAdmin: false };
  }

  const adminTokens = (process.env.ADMIN_TOKENS || '')
    .split(' ')
    .filter(Boolean);
  const isAdmin = adminTokens.includes(token);

  return { valid: true, isAdmin };
}

