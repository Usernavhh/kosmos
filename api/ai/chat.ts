import { streamAIChat, createKeyState } from '../shared/aiHandler.js';

const state = createKeyState();

interface Req {
  method?: string;
  body?: unknown;
}

interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
  write: (data: string) => void;
  end: (data?: unknown) => void;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    const body = (
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    ) as {
      message?: string;
      context?: string;
      history?: { role: 'user' | 'assistant'; text: string }[];
    };

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
    res.write(
      `data: ${JSON.stringify({ error: e instanceof Error ? e.message : String(e) })}\n\n`,
    );
    res.end();
  }
}