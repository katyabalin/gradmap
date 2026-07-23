export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { role, cities } = req.body;
  if (!role || !cities || !cities.length) {
    return res.status(400).json({ error: 'Missing role or cities' });
  }

  try {
    const cityResults = await Promise.all(
      cities.map(async (city) => {
        const q = encodeURIComponent(`${role} in ${city}`);
        const url = `https://serpapi.com/search.json?engine=google_jobs&q=${q}&num=5&api_key=${process.env.SERPAPI_KEY}`;
        const r = await fetch(url);
        const data = await r.json();
        return (data.jobs_results || []).slice(0, 5).map((job) => ({
          title: job.title,
          company: job.company_name,
          location: job.location,
          city,
          salary: job.detected_extensions?.salary || null,
          posted: job.detected_extensions?.posted_at || null,
          description: (job.description || '').slice(0, 200),
          applyLink: job.related_links?.[0]?.link || null,
        }));
      })
    );

    res.status(200).json({ jobs: cityResults.flat() });
  } catch (error) {
    res.status(500).json({ error: 'Job search failed' });
  }
}
