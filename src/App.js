import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import InputForm from './components/InputForm';
import Results from './components/Results';
import { analyzeCity } from './utils/api';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const data = await analyzeCity(formData);
      setResults(data);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Header />
      <main className="main">
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
      </main>
    </div>
  );
}

export default App;