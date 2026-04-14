import React from 'react';
import './GradMapCaseStudy.css';

function Section({ number, title, children }) {
  return (
    <section className="gcs-section">
      <div className="gcs-section-header">
        <span className="gcs-section-num">{number}</span>
        <h2 className="gcs-section-title">{title}</h2>
      </div>
      <div className="gcs-section-body">{children}</div>
    </section>
  );
}

function MetricRow({ metric, what, target }) {
  return (
    <div className="gcs-metric-row">
      <div className="gcs-metric-name">{metric}</div>
      <div className="gcs-metric-what">{what}</div>
      <div className="gcs-metric-target">{target}</div>
    </div>
  );
}

function RoadmapItem({ priority, feature, why }) {
  const colors = { High: '#16a34a', Medium: '#f59e0b', Low: '#9ca3af' };
  return (
    <div className="gcs-road-item">
      <div className="gcs-road-priority" style={{ color: colors[priority] }}>{priority}</div>
      <div className="gcs-road-feature">{feature}</div>
      <div className="gcs-road-why">{why}</div>
    </div>
  );
}

export default function GradMapCaseStudy() {
  

  if (window.location.pathname !== '/case-study') return null;

  return (
    <div className="gcs-page">

      {/* Cover */}
      <div className="gcs-cover">
        <div className="gcs-cover-inner">
          <div className="gcs-cover-label">✦ Product Case Study</div>
          <h1 className="gcs-cover-title">GradMap</h1>
          <p className="gcs-cover-sub">City Intelligence for New Grads</p>
          <div className="gcs-cover-meta">
            <div className="gcs-meta-chip">React</div>
            <div className="gcs-meta-chip">Claude API</div>
            <div className="gcs-meta-chip">Census Bureau API</div>
            <div className="gcs-meta-chip">Vercel</div>
          </div>
          <div className="gcs-cover-stats">
            <div className="gcs-cover-stat"><div className="gcs-stat-n">12</div><div className="gcs-stat-l">Cities</div></div>
            <div className="gcs-cover-stat"><div className="gcs-stat-n">4</div><div className="gcs-stat-l">Core Features</div></div>
            <div className="gcs-cover-stat"><div className="gcs-stat-n">Live</div><div className="gcs-stat-l">Deployed</div></div>
          </div>
        </div>
      </div>

      <div className="gcs-container">

        {/* 01 Overview */}
        <Section number="01" title="Overview">
          <p className="gcs-body">GradMap helps new grads figure out what their life actually looks like in a new city. Enter your salary, city, age, and lifestyle preferences — and get a real breakdown of take-home pay, AI-powered neighborhood recommendations, Census demographics, and a personalized monthly budget breakdown.</p>
          <div className="gcs-callout">
            The core insight: most cost-of-living tools show you numbers. GradMap tells you what to do with them.
          </div>
        </Section>

        {/* 02 Problem */}
        <Section number="02" title="The Problem">
          <p className="gcs-body">I was trying to figure out if I could afford to live in NYC on an APM salary after graduation. I googled "cost of living NYC" and got generic articles. I tried salary calculators and got a number with no context. Nothing told me which neighborhoods fit my budget, what $85k actually feels like to live on, or whether I'd have money left over after rent and groceries.</p>
          <p className="gcs-body">I talked to classmates who were also job hunting. Every single one had the same problem — multiple offers in different cities, no good way to compare them on anything other than raw salary.</p>
          <div className="gcs-problem-box">
            <div className="gcs-problem-label">Problem Statement</div>
            <p className="gcs-problem-text">New grads evaluating job offers have no tool that combines salary, taxes, real rent data, cost of living, and neighborhood fit into one honest, personalized picture.</p>
          </div>
        </Section>

        {/* 03 Target User */}
        <Section number="03" title="Target User">
          <div className="gcs-persona">
            <div className="gcs-persona-header">Primary Persona</div>
            {[
              ['Name', 'Maya, 22'],
              ['Situation', 'Senior year, two job offers — one in NYC, one in Austin'],
              ['Goal', 'Figure out which offer actually pays more after taxes and cost of living'],
              ['Frustration', 'The NYC salary is higher but I have no idea if I\'d actually have more money'],
              ['Quote', '"I just want to know — can I actually live there on this salary?"'],
            ].map(([k, v]) => (
              <div key={k} className="gcs-persona-row">
                <div className="gcs-persona-key">{k}</div>
                <div className={'gcs-persona-val' + (k === 'Quote' ? ' gcs-persona-quote' : '')}>{v}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 04 The Honesty Problem */}
        <Section number="04" title="The Honesty Problem">
          <p className="gcs-body">This is the most important product decision I made.</p>
          <p className="gcs-body">The first version of GradMap used the standard 30% rule for rent — if you make $85k, your max rent is $1,389/mo. That math is technically correct. The app showed NYC with $3,200/mo left after rent and called it affordable.</p>
          <p className="gcs-body" style={{ fontWeight: 600, color: '#111827' }}>That was wrong.</p>
          <p className="gcs-body">Nobody pays $1,389/mo for rent in NYC. The real average is $3,200/mo. When I replaced the 30% rule with real average rent data and added a cost of living index, the results completely changed:</p>

          <div className="gcs-comparison-table">
            <div className="gcs-comp-header">
              <div></div>
              <div>V1 — 30% Rule</div>
              <div>V2 — Real Data</div>
            </div>
            <div className="gcs-comp-row">
              <div className="gcs-comp-city">NYC on $85k</div>
              <div className="gcs-comp-v1">$3,200/mo left ✓</div>
              <div className="gcs-comp-v2 red">−$559/mo after expenses ✗</div>
            </div>
            <div className="gcs-comp-row">
              <div className="gcs-comp-city">Austin on $85k</div>
              <div className="gcs-comp-v1">$1,583/mo left</div>
              <div className="gcs-comp-v2 green">$1,706/mo after expenses ✓</div>
            </div>
          </div>

          <div className="gcs-callout" style={{ marginTop: '1.5rem' }}>
            Version 1 made NYC look affordable. Version 2 told the truth. The product lesson: showing users numbers they want to see is not the same as helping them make good decisions.
          </div>
        </Section>

        {/* 05 Solution */}
        <Section number="05" title="The Solution">
          <p className="gcs-body">GradMap is built around four core features, each designed to answer a specific user question:</p>
          <div className="gcs-features">
            {[
              { name: 'Money Breakdown', q: '"What do I actually take home?"', desc: 'Real take-home after federal, state, and FICA taxes. Shows actual average rent for that city, not a theoretical estimate.' },
              { name: 'AI City Analysis', q: '"What does life actually look like here?"', desc: 'Claude API generates a personalized summary with 3 specific neighborhood recommendations — rent ranges, vibe, pros, and one honest warning.' },
              { name: 'City Comparison', q: '"Which offer is actually better?"', desc: 'Side-by-side breakdown of two offers with real tax rates, average rent, and cost of living. AI explains exactly why one wins.' },
              { name: 'Lifestyle Budget', q: '"Where does my money go?"', desc: '5-question quiz about your habits generates an AI budget breakdown by category, adjusted for local cost of living.' },
            ].map(f => (
              <div key={f.name} className="gcs-feature-card">
                <div className="gcs-feature-name">{f.name}</div>
                <div className="gcs-feature-q">{f.q}</div>
                <div className="gcs-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 06 Key Decisions */}
        <Section number="06" title="Key Product Decisions">
          {[
            {
              title: 'Real rent vs 30% rule',
              body: 'The most important call. The 30% rule is textbook math — it said NYC was affordable on $85k. Real average rent data said the opposite. Choosing honesty over flattering numbers made the product actually useful.',
              tag: 'Product Integrity',
            },
            {
              title: 'City comparison as a separate tab',
              body: 'Originally planned as a toggle on the single city view. But users comparing job offers are in a completely different mindset than someone exploring a city. Two separate tabs let each flow be clean and purpose-built.',
              tag: 'UX Architecture',
            },
            {
              title: 'Lifestyle quiz as a second step',
              body: 'I could have put lifestyle questions on the input form. But showing the money breakdown first gives users context — they see "I have $1,706/mo left" and then naturally want to know where it goes. Two-step flows create better narratives.',
              tag: 'Flow Design',
            },
            {
              title: 'Age as an input',
              body: 'Adding age unlocked the whole personalization layer. A 22-year-old and a 35-year-old want completely different things from the same city. Age makes the AI analysis, neighborhood recs, and nearby categories all more relevant at once.',
              tag: 'Personalization',
            },
          ].map(d => (
            <div key={d.title} className="gcs-decision">
              <div className="gcs-decision-tag">{d.tag}</div>
              <div className="gcs-decision-title">{d.title}</div>
              <div className="gcs-decision-body">{d.body}</div>
            </div>
          ))}
        </Section>

        {/* 07 Data */}
        <Section number="07" title="What the Data Shows">
          <p className="gcs-body">GradMap pulls real Census Bureau ACS data for each city — not estimates, not blog posts, actual government survey data:</p>
          <div className="gcs-data-grid">
            <div className="gcs-data-card"><div className="gcs-data-val">Population</div><div className="gcs-data-sub">Total city population</div></div>
            <div className="gcs-data-card"><div className="gcs-data-val">Median Age</div><div className="gcs-data-sub">Real city median</div></div>
            <div className="gcs-data-card"><div className="gcs-data-val">Ages 20–34</div><div className="gcs-data-sub">% of your peer group</div></div>
            <div className="gcs-data-card"><div className="gcs-data-val">Diversity</div><div className="gcs-data-sub">Racial composition breakdown</div></div>
          </div>
          <p className="gcs-body" style={{ marginTop: '1rem' }}>This matters because demographic makeup directly affects social life, dating, friend-making, and community — things that don't show up in salary calculators but absolutely affect quality of life.</p>
        </Section>

        {/* 08 Metrics */}
        <Section number="08" title="Success Metrics">
          <p className="gcs-body">If GradMap were a scaled product, these are the metrics I'd track:</p>
          <div className="gcs-metrics-table">
            <div className="gcs-metrics-header">
              <div>Metric</div><div>What It Measures</div><div>Target</div>
            </div>
            <MetricRow metric="Lifestyle Quiz Completion" what="Are users engaging with personalization?" target="> 50% of sessions" />
            <MetricRow metric="City Comparison Usage" what="Is the comparison feature discoverable?" target="> 30% of users" />
            <MetricRow metric="Return Visit Rate" what="Do people come back when evaluating offers?" target="> 35% weekly" />
            <MetricRow metric="Time to Decision" what="Does GradMap help users decide faster?" target="< 3 min on page" />
          </div>
        </Section>

        {/* 09 Roadmap */}
        <Section number="09" title="What's Next">
          <div className="gcs-roadmap">
            <div className="gcs-road-header"><div>Priority</div><div>Feature</div><div>Why</div></div>
            <RoadmapItem priority="High" feature="Savings goal tracker" why="Show how long to save $10k, $20k, $50k on this salary in this city" />
            <RoadmapItem priority="High" feature="Job market section" why="Top employers, LinkedIn job search link, average salaries for that city" />
            <RoadmapItem priority="Medium" feature="Neighborhood demographics" why="City-wide data is helpful but neighborhood-level age and vibe breakdown is what actually drives housing decisions" />
            <RoadmapItem priority="Low" feature="Share your comparison" why="Export results as a card to send to friends or family when making a decision" />
          </div>
        </Section>

        {/* 10 Learnings */}
        <Section number="10" title="Key Learnings">
          <div className="gcs-learnings">
            {[
              ['Honest data beats flattering data', 'The 30% rule version of GradMap looked good but was useless. The real rent version was harder to look at but actually helped people make decisions.'],
              ['Users aren\'t asking "what does this cost?" — they\'re asking "can I actually live there?"', 'Those are different questions that need different answers. One needs a number. The other needs context, neighborhoods, and a lifestyle breakdown.'],
              ['Personalization compounds', 'Adding age didn\'t just change one thing — it made the AI analysis, neighborhood recs, and nearby categories all more relevant at once. One input, many downstream effects.'],
              ['Two-step flows create better narratives', 'Showing the money first, then letting users drill into their lifestyle budget, mirrors how people actually think about money. Product flow should follow mental models.'],
            ].map(([title, body], i) => (
              <div key={i} className="gcs-learning">
                <div className="gcs-learning-num">0{i + 1}</div>
                <div>
                  <div className="gcs-learning-title">{title}</div>
                  <div className="gcs-learning-body">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="gcs-footer">
          <div className="gcs-footer-name">Katya Balin</div>
          <div className="gcs-footer-links">
            <a href="mailto:katya.balin@gmail.com">katya.balin@gmail.com</a>
            <a href="https://linkedin.com/in/katya-balin" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://github.com/katyabalin" target="_blank" rel="noreferrer">GitHub</a>
            <a href="/">← Back to App</a>
          </div>
        </div>

      </div>
    </div>
  );
}