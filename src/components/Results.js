import React, { useState } from 'react';
import './Results.css';
import LifestyleQuiz from './LifestyleQuiz';
import BudgetBreakdown from './BudgetBreakdown';

function Results({ results }) {
  const { salary, city, takeHome, summary, cityStats, age, vibe } = results;
  const citySlug = city.split(',')[0].toLowerCase().replace(/ /g, '-');
  const stateSlug = (city.split(', ')[1] || '').toLowerCase();

  const [showQuiz, setShowQuiz] = useState(false);
  const [budgetData, setBudgetData] = useState(null);

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
    {
      label: '🍜 Restaurants',
      search: age < 30 ? 'trendy restaurants ' + city.split(',')[0] : 'best restaurants ' + city.split(',')[0],
      maps: 'restaurants in ' + city
    },
    {
      label: '☕ Cafes',
      search: age < 25 ? 'aesthetic cafes ' + city.split(',')[0] : age < 35 ? 'work-friendly coffee shops ' + city.split(',')[0] : 'cozy cafes ' + city.split(',')[0],
      maps: 'coffee shops in ' + city
    },
    {
      label: '💪 Gyms',
      search: vibe === 'Fitness & Wellness' ? 'pilates yoga studios ' + city.split(',')[0] : 'gyms ' + city.split(',')[0],
      maps: 'gyms in ' + city
    },
    { label: '🌳 Parks', search: 'parks ' + city.split(',')[0], maps: 'parks in ' + city },
    { label: '🛒 Grocery', search: 'grocery stores ' + city.split(',')[0], maps: 'grocery stores in ' + city },
    {
      label: '🎉 Nightlife',
      search: age < 25 ? 'bars clubs ' + city.split(',')[0] : 'wine bars cocktail bars ' + city.split(',')[0],
      maps: 'bars nightlife in ' + city
    },
    { label: '🏥 Healthcare', search: 'urgent care ' + city.split(',')[0], maps: 'urgent care clinics in ' + city },
    { label: '🚇 Transit', search: 'public transit ' + city.split(',')[0], maps: 'public transit ' + city },
  ];

  return (
    <div className="results">

      {/* Your Money */}
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
            <div className="pay-label">Avg Rent in {city.split(',')[0]}</div>
            <div className="pay-value">${takeHome.typicalRent.toLocaleString()}</div>
          </div>
          <div className="pay-card">
            <div className="pay-label">After Rent + Expenses</div>
            <div className="pay-value">${takeHome.leftAfterEverything.toLocaleString()}</div>
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

      {/* AI Summary */}
      {summary && (
        <div className="results-section">
          <div className="section-label">✦ Your Life in {city}</div>
          <div className="ai-box">
            <div className="ai-label">AI City Analysis</div>
            <div className="ai-text">{summary}</div>
          </div>
        </div>
      )}

      {/* Find Apartments */}
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

      {/* What's Nearby */}
      <div className="results-section">
        <div className="section-label">✦ What's Nearby</div>
        <div className="places-grid">
          {nearbyCategories.map(function(item) {
            return (
              
                key={item.label}
                className="nearby-card"
                href={'https://www.google.com/maps/search/' + encodeURIComponent(item.maps)}
                target="_blank"
                rel="noreferrer"
              >
                <div className="nearby-label">{item.label}</div>
                <div className="nearby-search-hint">{item.search.split(' ').slice(0, 3).join(' ')}...</div>
                <div className="nearby-action">Search on Google Maps</div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Lifestyle Budget Section */}
      <div className="results-section">
        <div className="section-label">✦ Your Monthly Budget</div>
        {!showQuiz && !budgetData && (
          <button className="budget-trigger-btn" onClick={() => setShowQuiz(true)}>
            ✦ See Where Your Money Actually Goes →
          </button>
        )}
        {showQuiz && !budgetData && (
          <LifestyleQuiz
            city={city}
            takeHome={takeHome}
            onResults={(data) => {
              setBudgetData(data);
              setShowQuiz(false);
            }}
          />
        )}
        {budgetData && (
          <BudgetBreakdown data={budgetData} city={city} takeHome={takeHome} />
        )}
      </div>

    </div>
  );
}

export default Results;