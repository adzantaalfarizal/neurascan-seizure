import React, { useState } from 'react';
import Header   from './components/Header';
import Home     from './pages/Home';
import Diagnosis from './pages/Diagnosis';
import Result   from './pages/Result';
import About    from './pages/About';
import './App.css';

export default function App() {
  const [page,   setPage]   = useState('home');
  const [result, setResult] = useState(null);

  const go = (to, data) => {
    if (data !== undefined) setResult(data);
    setPage(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <Header page={page} go={go} />
      <main className="main">
        {page === 'home'      && <Home      go={go} />}
        {page === 'diagnosis' && <Diagnosis go={go} />}
        {page === 'result'    && <Result    go={go} result={result} />}
        {page === 'about'     && <About     go={go} />}
      </main>
    </div>
  );
}
