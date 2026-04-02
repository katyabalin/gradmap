const FOURSQUARE_KEY = process.env.REACT_APP_FOURSQUARE_API_KEY;


// Calculate take-home pay
export function calculateTakeHome(salary, city) {
  const federal = salary * 0.22;
  const state = city.includes('TX') ? 0 : city.includes('FL') ? 0 : salary * 0.05;
  const fica = salary * 0.0765;
  const annual = salary - federal - state - fica;
  const monthly = Math.round(annual / 12);
  const maxRent = Math.round(monthly * 0.3);
  return { annual: Math.round(annual), monthly, maxRent };
}

// Get places from Foursquare
export async function getPlaces(city, category) {
  const res = await fetch(
    `https://api.foursquare.com/v3/places/search?near=${encodeURIComponent(city)}&categories=${category}&limit=5&sort=RELEVANCE`,
    {
      headers: {
        Authorization: FOURSQUARE_KEY,
        Accept: 'application/json',
      },
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

// Generate AI summary
async function generateAISummary(salary, city, vibe, takeHome) {
  const prompt = `You are a helpful advisor for new college graduates figuring out where to live.

Someone is moving to ${city} with a $${salary.toLocaleString()} annual salary.
Their monthly take-home pay is $${takeHome.monthly.toLocaleString()}.
Their max recommended rent is $${takeHome.maxRent.toLocaleString()}/month (30% rule).
${vibe ? `They want a ${vibe} neighborhood vibe.` : ''}

Write a friendly, specific 4-5 sentence summary that:
1. Tells them what their life actually looks like on this salary in ${city}
2. Recommends 2-3 specific neighborhoods that fit their budget${vibe ? ` and ${vibe} vibe` : ''}
3. Gives one honest piece of advice about living in ${city} on this income
4. Sounds like a smart friend who lives there, not a financial advisor

Be specific to ${city}. Be honest. Be encouraging but realistic.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.content[0].text;
}

// Main function
export async function analyzeCity({ salary, city, vibe }) {
  const takeHome = calculateTakeHome(salary, city);

  const [restaurants, cafes, gyms, parks] = await Promise.all([
    getPlaces(city, '13065'),
    getPlaces(city, '13032'),
    getPlaces(city, '18008'),
    getPlaces(city, '16032'),
  ]);

  const aiSummary = await generateAISummary(salary, city, vibe, takeHome);

  return {
    salary,
    city,
    vibe,
    takeHome,
    places: { restaurants, cafes, gyms, parks },
    aiSummary,
  };
}