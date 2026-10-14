import { defineConfig, loadEnv, type Plugin } from 'vite';
import { streamAIChat, createKeyState } from './api/shared/aiHandler';

function aiProxyPlugin(env: Record<string, string>): Plugin {
  for (const [k, v] of Object.entries(env)) {
    if (v && !process.env[k]) process.env[k] = v;
  }

  const state = createKeyState();

  return {
    name: 'kosmos-ai-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ai/chat', async (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }

        const raw = await new Promise<string>((resolve, reject) => {
          let d = '';
          req.on('data', (c) => (d += c));
          req.on('end', () => resolve(d));
          req.on('error', reject);
        });

        try {
          const body = JSON.parse(raw);
          if (!body.message) {
            res.write(`data: ${JSON.stringify({ error: 'message yo\`q' })}\n\n`);
            res.end();
            return;
          }

          await streamAIChat(
            state,
            {
              message: body.message,
              context: body.context ?? '',
              history: body.history ?? [],
            },
            (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
            (provider) => {
              res.write(`data: ${JSON.stringify({ done: true, provider })}\n\n`);
              res.end();
            },
            (err) => {
              res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
              res.end();
            },
          );
        } catch (e) {
          console.error('[vite-ai] Xato:', e);
          res.write(
            `data: ${JSON.stringify({ error: e instanceof Error ? e.message : String(e) })}\n\n`,
          );
          res.end();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api/tts': {
          target: 'http://127.0.0.1:5001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/tts/, '/tts'),
        },
      },
    },
    plugins: [aiProxyPlugin(env)],
    build: {
      target: 'es2022',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
    },
    worker: { format: 'es' },
    assetsInclude: ['**/*.wasm', '**/*.ktx2', '**/*.bin'],
  };
});