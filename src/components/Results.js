import React from 'react';
import './Results.css';


function Results({ results }) {
  const { salary, city, takeHome, summary, neighborhoods, cityStats } = results;
  const citySlug = city.split(',')[0].toLowerCase().replace(/ /g, '-');
  const stateSlug = (city.split(', ')[1] || '').toLowerCase();

  const housingLinks = [
    {
      name: 'Zillow',
      desc: 'Large inventory, great filters, save favorites',
      url: 'https://www.zillow.com/homes/for_rent/' + city.replace(/, /g, '-').replace(/ /g, '-') + '_rb/?price=0,' + takeHome.maxRent,
    },
    {
      name: 'Apartments.com',
      desc: 'Best for verified listings and virtual tours',
      url: 'https://www.apartments.com/' + citySlug + '-' + stateSlug + '/?max-price=' + takeHome.maxRent,
    },
    {
      name: 'Craigslist',
      desc: 'Best deals, sublets, and roommate listings',
      url: 'https://www.craigslist.org/search/apa?query=' + encodeURIComponent(city) + '&max_price=' + takeHome.maxRent,
    },
    {
      name: 'Facebook Marketplace',
      desc: 'Direct from landlords, often no broker fee',
      url: 'https://www.facebook.com/marketplace/category/propertyrentals/',
    },
  ];

  const nearbyCategories = [
    { label: '🍜 Restaurants', search: 'restaurants in ' + city },
    { label: '☕ Cafes', search: 'coffee shops in ' + city },
    { label: '💪 Gyms', search: 'gyms in ' + city },
    { label: '🌳 Parks', search: 'parks in ' + city },
    { label: '🛒 Grocery', search: 'grocery stores in ' + city },
    { label: '🎉 Nightlife', search: 'bars nightlife in ' + city },
    { label: '🏥 Healthcare', search: 'urgent care clinics in ' + city },
    { label: '🚇 Transit', search: 'public transit ' + city },
  ];

  return (
    <div className="results">

      <div className="results-section">
        <div className="section-label">✦ Your Money</div>
        <div className="pay-cards">
          <div className="pay-card">
            <div className="pay-label">Annual Salary</div>
            <div className="pay-value">${salary.toLocaleString()}</div>
          </div>
          <div className="pay-card pay-card-highlight">
            <div className="pay-label">Monthly Take-Home</div>
            <div className="pay-value">${takeHome.monthly.toLocaleString()}</div>
          </div>
          <div className="pay-card">
            <div className="pay-label">Max Rent (30% rule)</div>
            <div className="pay-value">${takeHome.maxRent.toLocaleString()}</div>
          </div>
          <div className="pay-card">
            <div className="pay-label">Left After Rent</div>
            <div className="pay-value">${(takeHome.monthly - takeHome.maxRent).toLocaleString()}</div>
          </div>
        </div>
      </div>


        {/* City Snapshot */}
{cityStats && (
  <div className="results-section">
    <div className="section-label">✦ City Snapshot</div>
    <div className="snapshot-grid">
      <div className="snapshot-card">
        <div className="snapshot-label">Population</div>
        <div className="snapshot-value">{(cityStats.totalPop / 1000000).toFixed(1)}M</div>
      </div>
      <div className="snapshot-card">
        <div className="snapshot-label">Median Age</div>
        <div className="snapshot-value">{cityStats.medianAge}</div>
      </div>
      <div className="snapshot-card">
        <div className="snapshot-label">Ages 20–34</div>
        <div className="snapshot-value">{cityStats.youngAdultPct}%</div>
        <div className="snapshot-sub">of residents</div>
      </div>
      <div className="snapshot-card">
        <div className="snapshot-label">Diversity</div>
        <div className="snapshot-diversity">
          <div className="div-row">
            <span className="div-label">White</span>
            <div className="div-bar-wrap">
              <div className="div-bar" style={{ width: cityStats.diversity.white + '%' }} />
            </div>
            <span className="div-pct">{cityStats.diversity.white}%</span>
          </div>
          <div className="div-row">
            <span className="div-label">Black</span>
            <div className="div-bar-wrap">
              <div className="div-bar div-bar-2" style={{ width: cityStats.diversity.black + '%' }} />
            </div>
            <span className="div-pct">{cityStats.diversity.black}%</span>
          </div>
          <div className="div-row">
            <span className="div-label">Asian</span>
            <div className="div-bar-wrap">
              <div className="div-bar div-bar-3" style={{ width: cityStats.diversity.asian + '%' }} />
            </div>
            <span className="div-pct">{cityStats.diversity.asian}%</span>
          </div>
          <div className="div-row">
            <span className="div-label">Hispanic</span>
            <div className="div-bar-wrap">
              <div className="div-bar div-bar-4" style={{ width: cityStats.diversity.hispanic + '%' }} />
            </div>
            <span className="div-pct">{cityStats.diversity.hispanic}%</span>
          </div>
        </div>
      </div>
    </div>




{/* Meetup link */}
<a className="meetup-link" href={({'New York, NY': 'https://www.meetup.com/cities/us/ny/new_york/', 'San Francisco, CA': 'https://www.meetup.com/cities/us/ca/san_francisco/', 'Los Angeles, CA': 'https://www.meetup.com/cities/us/ca/los_angeles/', 'Chicago, IL': 'https://www.meetup.com/cities/us/il/chicago/', 'Seattle, WA': 'https://www.meetup.com/cities/us/wa/seattle/', 'Austin, TX': 'https://www.meetup.com/cities/us/tx/austin/', 'Boston, MA': 'https://www.meetup.com/cities/us/ma/boston/', 'Washington, DC': 'https://www.meetup.com/cities/us/dc/washington/', 'Miami, FL': 'https://www.meetup.com/cities/us/fl/miami/', 'Denver, CO': 'https://www.meetup.com/cities/us/co/denver/', 'Atlanta, GA': 'https://www.meetup.com/cities/us/ga/atlanta/', 'Nashville, TN': 'https://www.meetup.com/cities/us/tn/nashville/'})[city] || 'https://www.meetup.com/find/'} target="_blank" rel="noreferrer">
  <div className="meetup-left">
    <div className="meetup-title">🎉 Find Your Community</div>
    <div className="meetup-desc">Browse local meetups, events, and groups for new residents in {city}</div>
  </div>
  <div className="meetup-arrow">&#8594;</div>
</a>
  </div>
)}






      {summary && (
        <div className="results-section">
          <div className="section-label">✦ Your Life in {city}</div>
          <div className="ai-box">
            <div className="ai-label">AI City Analysis</div>
            <div className="ai-text">{summary}</div>
          </div>
        </div>
      )}

      <div className="results-section">
        <div className="section-label">✦ Find Apartments</div>
        <p className="housing-intro">
          Browse real listings in {city} filtered to your budget (under ${takeHome.maxRent.toLocaleString()}/mo):
        </p>
        <div className="housing-links">
          {housingLinks.map(function(link) {
            return (
              <a key={link.name} className="housing-link" href={link.url} target="_blank" rel="noreferrer">
                <div>
                  <div className="housing-link-name">{link.name}</div>
                  <div className="housing-link-desc">{link.desc}</div>
                </div>
                <div className="housing-link-arrow">&#8594;</div>
              </a>
            );
          })}
        </div>
      </div>

      <div className="results-section">
        <div className="section-label">✦ What's Nearby</div>
        <div className="places-grid">
          {nearbyCategories.map(function(item) {
            return (
              <a
                key={item.label}
                className="nearby-card"
                href={'https://www.google.com/maps/search/' + encodeURIComponent(item.search)}
                target="_blank"
                rel="noreferrer"
              >
                <div className="nearby-label">{item.label}</div>
                <div className="nearby-action">Search on Google Maps</div>
              </a>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default Results;