import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export async function logEvent(eventData) {
  try {
    await supabase.from('events').insert([eventData]);
  } catch (err) {
    console.error('Logging error:', err);
  }
}

// Logs Claude token usage and cache stats per AI call.
// Requires an `ai_usage` table in Supabase:
//   id, created_at, event_type, city, input_tokens, output_tokens,
//   cache_creation_tokens, cache_read_tokens
export async function logAIUsage({ event_type, city = null, input_tokens, output_tokens, cache_creation_tokens = 0, cache_read_tokens = 0 }) {
  try {
    await supabase.from('ai_usage').insert([{
      event_type,
      city,
      input_tokens,
      output_tokens,
      cache_creation_tokens,
      cache_read_tokens,
    }]);
  } catch {
    // Silent — table may not exist yet
  }
}
