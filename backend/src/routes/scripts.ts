import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

export interface ScriptMetadata {
  path: string;
  lang: 'javascript' | 'python' | 'bash';
  category: string;
  description: string;
  defaultRunMode: 'sync' | 'async';
  adminOnly: boolean;
  destructive: boolean;
  dryRunCapable: boolean;
  timeoutMs: number;
  params: Record<string, unknown>;
  env?: Record<string, unknown>;
  notes?: string;
}

let scriptsCache: Map<string, ScriptMetadata> | null = null;

// Load scripts from config/scripts.yml
function loadScriptsConfig(): Map<string, ScriptMetadata> {
  if (scriptsCache) {
    return scriptsCache;
  }

  try {
    const configPath = path.join(
      process.cwd(),
      '..',
      'config',
      'scripts.yml'
    );
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = YAML.parse(content);

    scriptsCache = new Map();

    if (config.scripts) {
      for (const [name, metadata] of Object.entries(config.scripts)) {
        if (metadata && typeof metadata === 'object') {
          scriptsCache.set(name, metadata as ScriptMetadata);
        }
      }
    }

    return scriptsCache;
  } catch (error) {
    console.error('Error loading scripts config:', error);
    scriptsCache = new Map();
    return scriptsCache;
  }
}

export async function scriptRoutes(app: FastifyInstance) {
  // List all available scripts
  app.get('/', async (request, reply) => {
    const scripts = loadScriptsConfig();
    const scriptList = Array.from(scripts.entries()).map(([name, metadata]) => ({
      name,
      ...metadata,
    }));

    return {
      status: 'success',
      count: scriptList.length,
      scripts: scriptList,
    };
  });

  // Get a specific script metadata
  app.get('/:name', async (request, reply) => {
    const { name } = request.params as { name: string };
    const scripts = loadScriptsConfig();
    const metadata = scripts.get(name);

    if (!metadata) {
      return reply.status(404).send({
        status: 'error',
        message: `Script '${name}' not found in whitelist`,
      });
    }

    return {
      status: 'success',
      name,
      ...metadata,
    };
  });
}

export function getScriptMetadata(scriptName: string): ScriptMetadata | undefined {
  const scripts = loadScriptsConfig();
  return scripts.get(scriptName);
}

export function getAllScripts(): Map<string, ScriptMetadata> {
  return loadScriptsConfig();
}

