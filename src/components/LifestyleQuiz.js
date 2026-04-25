import React, { useState } from 'react';
import './LifestyleQuiz.css';

const QUESTIONS = [
  {
    id: 'going_out',
    label: '🍸 Going out',
    options: ['Rarely', 'Sometimes', 'A lot'],
  },
  {
    id: 'fitness',
    label: '💪 Fitness',
    options: ['Not really', 'Gym membership', 'Boutique classes'],
  },
  {
    id: 'shopping',
    label: '🛍 Shopping',
    options: ['Minimal', 'Moderate', 'Heavy'],
  },
  {
    id: 'food',
    label: '🍽 Food',
    options: ['Mostly cook', 'Mix', 'Mostly eat out'],
  },
  {
    id: 'transport',
    label: '🚇 Transport',
    options: ['Public transit', 'Rideshare sometimes', 'Car / Uber often'],
  },
];

function LifestyleQuiz({ city, takeHome, onResults }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const allAnswered = QUESTIONS.every(q => answers[q.id]);

  const handleSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a financial advisor helping a new grad understand their monthly budget.

They live in ${city} with $${takeHome.monthly.toLocaleString()}/month take-home pay.
After average rent of $${takeHome.typicalRent.toLocaleString()}/mo they have $${takeHome.leftAfterRent.toLocaleString()}/mo left.
The cost of living index for ${city} is ${takeHome.colIndex} (100 = national average).

Their lifestyle preferences:
- Going out: ${answers.going_out}
- Fitness: ${answers.fitness}
- Shopping: ${answers.shopping}
- Food habits: ${answers.food}
- Transport: ${answers.transport}

Return ONLY a valid JSON object with NO markdown, backticks, or explanation:
{
  "categories": [
    { "name": "Groceries & Cooking", "emoji": "🥦", "low": 200, "high": 400, "tip": "one specific money-saving tip for this city" },
    { "name": "Eating Out", "emoji": "🍜", "low": 150, "high": 600, "tip": "one specific tip" },
    { "name": "Going Out & Fun", "emoji": "🎉", "low": 100, "high": 500, "tip": "one specific tip" },
    { "name": "Fitness", "emoji": "💪", "low": 0, "high": 200, "tip": "one specific tip" },
    { "name": "Shopping & Clothes", "emoji": "🛍", "low": 50, "high": 400, "tip": "one specific tip" },
    { "name": "Transport", "emoji": "🚇", "low": 50, "high": 300, "tip": "one specific tip" },
    { "name": "Subscriptions & Misc", "emoji": "📱", "low": 50, "high": 150, "tip": "one specific tip" }
  ],
  "total_low": 600,
  "total_high": 2550,
  "verdict": "One sentence summary of what their lifestyle actually costs in ${city} and whether they can afford it on this income."
}

Make the ranges realistic for ${city} and their specific lifestyle choices.`,
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.text);
      onResults(parsed);
    } catch {
      onResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-wrap">
      <div className="quiz-title">✦ What's Your Lifestyle Like?</div>
      <p className="quiz-sub">Answer 5 quick questions and we'll show you exactly where your money goes in {city}.</p>
      <div className="quiz-questions">
        {QUESTIONS.map(q => (
          <div key={q.id} className="quiz-question">
            <div className="quiz-q-label">{q.label}</div>
            <div className="quiz-options">
              {q.options.map(opt => (
                <button
                  key={opt}
                  className={'quiz-option' + (answers[q.id] === opt ? ' quiz-option-active' : '')}
                  onClick={() => handleSelect(q.id, opt)}
                  type="button"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        className="quiz-submit"
        onClick={handleSubmit}
        disabled={!allAnswered || loading}
      >
        {loading ? 'Calculating your budget...' : '✦ Show My Budget Breakdown'}
      </button>
    </div>
  );
}

export default LifestyleQuiz;