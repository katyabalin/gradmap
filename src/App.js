import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import InputForm from './components/InputForm';
import Results from './components/Results';
import CompareForm from './components/CompareForm';
import CompareResults from './components/CompareResults';
import { analyzeCity, compareAI } from './utils/api';


function App() {
  const [activeTab, setActiveTab] = useState('single');

  // Single city state
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Compare state
  const [compareResults, setCompareResults] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState('');

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const data = await analyzeCity(formData);
      setResults(data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };


const handleCompare = async (formData) => {
  setCompareLoading(true);
  setCompareError('');
  setCompareResults(null);
  try {
    const [cityAData, cityBData] = await Promise.all([
      analyzeCity({ salary: formData.salaryA, city: formData.cityA, vibe: formData.vibe, age: formData.age }),
      analyzeCity({ salary: formData.salaryB, city: formData.cityB, vibe: formData.vibe, age: formData.age }),
    ]);
    setCompareResults({ cityA: cityAData, cityB: cityBData });
  } catch {
    setCompareError('Something went wrong. Please try again.');
  } finally {
    setCompareLoading(false);
  }
};

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResults(null);
    setCompareResults(null);
    setError('');
    setCompareError('');
  };

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="main">
        {activeTab === 'single' ? (
          <>
            <div className="hero">
              <div className="hero-label">✦ For New Grads</div>
              <h1 className="hero-title">What does your life<br />actually <em>look like?</em></h1>
              <p className="hero-sub">Enter your salary and city. Get a real breakdown of what you can afford, where to live, and what your day-to-day life looks like on that income.</p>
            </div>
            <InputForm onSubmit={handleSubmit} loading={loading} />
            {error && <div className="error-msg">{error}</div>}
            {loading && (
              <div className="loading-wrap">
                <div className="loading-bar"><div className="loading-fill" /></div>
                <div className="loading-text">Mapping your city...</div>
              </div>
            )}
            {results && <Results results={results} />}
          </>
        ) : (
          <>
            <div className="hero">
              <div className="hero-label">✦ Compare Offers</div>
              <h1 className="hero-title">Which city actually<br /><em>pays more?</em></h1>
              <p className="hero-sub">Enter two job offers in different cities. See which one gives you more money, a better lifestyle, and the right neighborhood for you.</p>
            </div>
            <CompareForm onSubmit={handleCompare} loading={compareLoading} />
            {compareError && <div className="error-msg">{compareError}</div>}
            {compareLoading && (
              <div className="loading-wrap">
                <div className="loading-bar"><div className="loading-fill" /></div>
                <div className="loading-text">Comparing your cities...</div>
              </div>
            )}
            {compareResults && <CompareResults results={compareResults} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;