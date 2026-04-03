
const RENTCAST_KEY = process.env.REACT_APP_RENTCAST_API_KEY;


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

// Get city demographics from Census API
export async function getCityStats(city) {
  const CENSUS_KEY = process.env.REACT_APP_CENSUS_API_KEY;

  const cityMap = {
    'New York, NY': { place: '51000', state: '36' },
    'San Francisco, CA': { place: '67000', state: '06' },
    'Los Angeles, CA': { place: '44000', state: '06' },
    'Chicago, IL': { place: '14000', state: '17' },
    'Seattle, WA': { place: '63000', state: '53' },
    'Austin, TX': { place: '05000', state: '48' },
    'Boston, MA': { place: '07000', state: '25' },
    'Washington, DC': { place: '50000', state: '11' },
    'Miami, FL': { place: '45000', state: '12' },
    'Denver, CO': { place: '20000', state: '08' },
    'Atlanta, GA': { place: '04000', state: '13' },
    'Nashville, TN': { place: '52006', state: '47' },
  };

  const location = cityMap[city];
  if (!location) return null;

  try {
    const url = `https://api.census.gov/data/2022/acs/acs5?get=B01003_001E,B01002_001E,B02001_002E,B02001_003E,B02001_004E,B02001_005E,B02001_006E,B03003_003E,B01001_007E,B01001_008E,B01001_009E,B01001_010E,B01001_011E,B01001_012E,B01001_031E,B01001_032E,B01001_033E,B01001_034E,B01001_035E,B01001_036E&for=place:${location.place}&in=state:${location.state}&key=${CENSUS_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const row = data[1];

    const totalPop = parseInt(row[0]);
    const medianAge = parseFloat(row[1]);
    const white = parseInt(row[2]);
    const black = parseInt(row[3]);
    const native = parseInt(row[4]);
    const asian = parseInt(row[5]);
    const pacific = parseInt(row[6]);
    const hispanic = parseInt(row[7]);

    // Ages 20-34 male + female
    const youngAdults = [row[8],row[9],row[10],row[11],row[12],row[13],
      row[14],row[15],row[16],row[17],row[18],row[19]]
      .reduce((a, b) => a + parseInt(b || 0), 0);

    return {
      totalPop,
      medianAge,
      youngAdultPct: Math.round((youngAdults / totalPop) * 100),
      diversity: {
        white: Math.round((white / totalPop) * 100),
        black: Math.round((black / totalPop) * 100),
        asian: Math.round((asian / totalPop) * 100),
        hispanic: Math.round((hispanic / totalPop) * 100),
        other: Math.round(((native + pacific) / totalPop) * 100),
      },
    };
  } catch {
    return null;
  }
}

// Get places from OpenStreetMap (no API key needed)
export async function getPlaces(city, type) {
  const cityCoords = {
    'New York, NY': [40.7128, -74.0060],
    'San Francisco, CA': [37.7749, -122.4194],
    'Los Angeles, CA': [34.0522, -118.2437],
    'Chicago, IL': [41.8781, -87.6298],
    'Seattle, WA': [47.6062, -122.3321],
    'Austin, TX': [30.2672, -97.7431],
    'Boston, MA': [42.3601, -71.0589],
    'Washington, DC': [38.9072, -77.0369],
    'Miami, FL': [25.7617, -80.1918],
    'Denver, CO': [39.7392, -104.9903],
    'Atlanta, GA': [33.7490, -84.3880],
    'Nashville, TN': [36.1627, -86.7816],
  };

  const coords = cityCoords[city] || [40.7128, -74.0060];
  const [lat, lon] = coords;
  const radius = 8000;

  const queries = {
    restaurants: '(node[amenity=restaurant](around:RADIUS,LAT,LON);way[amenity=restaurant](around:RADIUS,LAT,LON);)',
    cafes: '(node[amenity=cafe](around:RADIUS,LAT,LON);node[amenity=coffee_shop](around:RADIUS,LAT,LON);way[amenity=cafe](around:RADIUS,LAT,LON);)',
    gyms: '(node[leisure=fitness_centre](around:RADIUS,LAT,LON);way[leisure=fitness_centre](around:RADIUS,LAT,LON);node[amenity=gym](around:RADIUS,LAT,LON);)',
    parks: '(way[leisure=park](around:RADIUS,LAT,LON);node[leisure=park](around:RADIUS,LAT,LON);relation[leisure=park](around:RADIUS,LAT,LON);)',
  };

  const q = (queries[type] || queries.restaurants)
    .replace(/RADIUS/g, radius)
    .replace(/LAT/g, lat)
    .replace(/LON/g, lon);

  const overpassQuery = `[out:json][timeout:15]; ${q} out center 5;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.elements || [])
      .filter(el => el.tags?.name)
      .slice(0, 5)
      .map(el => ({
        name: el.tags.name,
        location: {
          formatted_address: el.tags['addr:street']
            ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}`.trim()
            : '',
        },
        categories: [{ name: el.tags.cuisine || el.tags.sport || el.tags.leisure || type }],
      }));
  } catch {
    return [];
  }
}

// Get rental listings from RentCast
export async function getRentals(city, maxRent) {
  try {
    const parts = city.split(', ');
    const cityName = parts[0];
    const state = parts[1] || '';

    const res = await fetch(
      `https://api.rentcast.io/v1/listings/rental/long-term?city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(state)}&limit=6&status=Active`,
      {
        headers: {
          'X-Api-Key': RENTCAST_KEY,
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const listings = Array.isArray(data) ? data : data.listings || [];
    return listings
      .filter(l => !l.price || l.price <= maxRent * 1.3)
      .slice(0, 6);
  } catch {
    return [];
  }
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

  try {
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
  } catch {
    return null;
  }
}

// Main function
export async function analyzeCity({ salary, city, vibe }) {
  const takeHome = calculateTakeHome(salary, city);

  const [aiResult, cityStats] = await Promise.all([
    generateAISummary(salary, city, vibe, takeHome),
    getCityStats(city),
  ]);

  return {
    salary,
    city,
    vibe,
    takeHome,
    summary: aiResult?.summary || null,
    neighborhoods: aiResult?.neighborhoods || [],
    cityStats,
  };
}