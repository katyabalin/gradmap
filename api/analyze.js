const SYSTEM_PROMPT = `You are a helpful financial and lifestyle advisor for new college graduates figuring out where to live. You give honest, specific, data-driven advice tailored to the person's salary, age, and city.`;

const ANTHROPIC_HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': process.env.ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-beta': 'prompt-caching-2024-07-31',
};

// Tool schema for structured city analysis — forces valid output, no JSON.parse needed
const CITY_ANALYSIS_TOOL = {
  name: 'report_city_analysis',
  description: 'Report a structured city analysis for a new grad considering this city on this salary.',
  input_schema: {
    type: 'object',
    required: ['summary', 'neighborhoods'],
    properties: {
      summary: {
        type: 'string',
        description: '3-4 sentence friendly overview of what life looks like in this city on this salary. Be specific, honest, sound like a smart friend who lives there.',
      },
      neighborhoods: {
        type: 'array',
        description: 'Exactly 3 neighborhoods that fit this budget and vibe.',
        items: {
          type: 'object',
          required: ['name', 'borough', 'vibe', 'rentRange', 'pros', 'warning'],
          properties: {
            name: { type: 'string' },
            borough: { type: 'string', description: 'Borough or area name, empty string if not applicable' },
            vibe: { type: 'string', description: 'One sentence description of the neighborhood vibe' },
            rentRange: { type: 'string', description: 'e.g. $1,200–$1,800' },
            pros: { type: 'array', items: { type: 'string' }, description: 'Exactly 3 pros' },
            warning: { type: 'string', description: 'One honest heads-up about this neighborhood' },
          },
        },
      },
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, type, censusUrl } = req.body;

  try {
    // Census proxy — unchanged
    if (type === 'census') {
      const response = await fetch(censusUrl);
      const data = await response.json();
      return res.status(200).json({ data });
    }

    // Tool use: structured neighborhood + summary analysis with prompt caching
    if (type === 'analyze') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: ANTHROPIC_HEADERS,
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          tools: [CITY_ANALYSIS_TOOL],
          tool_choice: { type: 'tool', name: 'report_city_analysis' },
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const toolUse = data.content?.find(b => b.type === 'tool_use');
      return res.status(200).json({
        result: toolUse?.input || null,
        usage: data.usage || null,
      });
    }

    // Streaming: SSE token-by-token response with prompt caching
    if (type === 'stream') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      if (res.socket) res.socket.setNoDelay(true);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: ANTHROPIC_HEADERS,
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          stream: true,
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let usage = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
            }
            if (parsed.type === 'message_delta' && parsed.usage) {
              usage = parsed.usage;
            }
          } catch {}
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, usage })}\n\n`);
      return res.end();
    }

    // Default: plain text response (backwards compat for any callers)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: ANTHROPIC_HEADERS,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    return res.status(200).json({ text: data.content[0].text });
  } catch {
    res.status(500).json({ error: 'Request failed' });
  }
}
