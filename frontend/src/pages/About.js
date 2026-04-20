import React, { useState, useEffect } from 'react';
import './About.css';

const API = process.env.REACT_APP_API_URL;

const ALGO_STEPS = [
  { n: '01', t: 'Input Data',        d: 'Pengguna memasukkan usia, suhu tubuh, durasi demam, durasi kejang, dan 11 gejala biner klinis.' },
  { n: '02', t: 'Preprocessing',     d: 'Fitur numerik (usia, suhu, durasi) di-standardisasi menggunakan StandardScaler; fitur biner dibiarkan apa adanya.' },
  { n: '03', t: 'Random Forest',     d: '300 decision tree memilih subset fitur acak dan melakukan voting probabilistik secara paralel.' },
  { n: '04', t: 'Gradient Boosting', d: '200 estimator GBM memperbaiki kesalahan secara iteratif dengan learning rate 0.05.' },
  { n: '05', t: 'Soft Voting',       d: 'Probabilitas dari RF dan GBM dirata-ratakan untuk menghasilkan keputusan akhir yang lebih stabil.' },
  { n: '06', t: 'Output',            d: 'Label kategori + confidence score + diagnosis spesifik berdasarkan pola gejala dominan + rekomendasi klinis.' },
];

const CLASS_LABELS = ['Kejang Demam Sederhana', 'Kejang Demam Kompleks', 'Kejang Tanpa Demam'];
const CLASS_COLORS = ['#38d9f5', '#fbbf24', '#a78bfa'];

const FEAT_LABELS = {
  age_months:            'Usia Anak (bulan)',
  temperature:           'Suhu Tubuh (°C)',
  fever_duration_h:      'Lama Demam Sebelum Kejang (jam)',
  duration_minutes:      'Durasi Kejang (menit)',
  fever_before:          'Didahului Demam',
  sudden_onset:          'Muncul Mendadak',
  focal_movement:        'Gerakan Fokal (Satu Sisi)',
  eye_deviation:         'Mata Mendelik ke Satu Arah',
  loss_of_consciousness: 'Hilang Kesadaran',
  recurrence_same_day:   'Berulang dalam 24 Jam',
  cyanosis:              'Bibir/Kulit Kebiruan (Sianosis)',
  postictal_drowsy:      'Sangat Mengantuk Pasca Kejang',
  family_history:        'Riwayat Keluarga Kejang/Epilepsi',
  prior_seizure:         'Pernah Kejang Sebelumnya',
  developmental_delay:   'Keterlambatan Tumbuh Kembang',
};

export default function About({ go }) {
  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');

  useEffect(() => {
    fetch(`${API}/api/model-info`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { setInfo(d); setLoading(false); })
      .catch(e => { setErr(`Gagal memuat info model: ${e.message}`); setLoading(false); });
  }, []);

  const topFeats = info?.feature_importances
    ? Object.entries(info.feature_importances).sort((a, b) => b[1] - a[1]).slice(0, 12)
    : [];
  const maxImp = topFeats.length ? topFeats[0][1] : 1;

  return (
    <div className="about-page">
      <div className="about-wrap">

        {/* Header */}
        <div className="about-hdr">
          <span className="about-chip">Model & Metodologi</span>
          <h1>Tentang Sistem NeuraScan</h1>
          <p>
            Penjelasan algoritma, performa model, dan metodologi klasifikasi kondisi kejang
            pada anak berbasis machine learning.
          </p>
        </div>

        {/* Algorithm */}
        <div className="algo-card">
          <div className="algo-top">
            <div>
              <h2>Voting Ensemble</h2>
              <p>Random Forest (300 tree) + Gradient Boosting (200 estimator) · Soft Voting</p>
            </div>
            <span className="algo-badge">Best for Tabular Data</span>
          </div>

          <div className="algo-why">
            <span className="why-label">Mengapa Ensemble, Bukan Deep Learning?</span>
            <p>
              Untuk dataset gejala tabular berukuran kecil–menengah (&lt;10 K sampel),
              metode ensemble pohon keputusan secara konsisten mengungguli jaringan saraf tiruan
              (MLP, LSTM) karena: tidak memerlukan normalisasi skala besar, tahan terhadap
              overfitting, dapat menjelaskan keputusan melalui feature importance, serta waktu
              training yang jauh lebih singkat dengan performa setara atau lebih baik.
            </p>
          </div>

          <div className="algo-steps">
            {ALGO_STEPS.map(s => (
              <div className="step" key={s.n}>
                <div className="step-n">{s.n}</div>
                <div>
                  <div className="step-t">{s.t}</div>
                  <div className="step-d">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        {loading && <div className="info-box">Memuat data model dari server...</div>}
        {err     && <div className="info-box err">{err}</div>}

        {info && (
          <>
            {/* Big metrics */}
            <div className="sec-block">
              <h2>Performa Model</h2>
              <p className="sec-sub">Dievaluasi pada 20% data uji (240 sampel, stratified split)</p>
              <div className="big-metrics">
                {[
                  { k: 'accuracy',        l: 'Akurasi',          c: '#5ea1ff' },
                  { k: 'f1_score',        l: 'F1 Score',         c: '#4ade80' },
                  { k: 'precision',       l: 'Presisi',          c: '#a78bfa' },
                  { k: 'recall',          l: 'Recall',           c: '#fbbf24' },
                  { k: 'cv_accuracy_mean',l: 'CV Accuracy (5×)', c: '#38d9f5' },
                ].map(m => (
                  <div className="bm-card" key={m.k}>
                    <div className="bm-val" style={{ color: m.c }}>
                      {((info.metrics[m.k] || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="bm-lbl">{m.l}</div>
                    {m.k === 'cv_accuracy_mean' && info.metrics.cv_accuracy_std && (
                      <div className="bm-std">± {(info.metrics.cv_accuracy_std * 100).toFixed(1)}%</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Confusion matrix */}
            {info.confusion_matrix?.length > 0 && (
              <div className="sec-block">
                <h2>Confusion Matrix</h2>
                <p className="sec-sub">Baris = label aktual &nbsp;|&nbsp; Kolom = label prediksi</p>
                <div className="cm-scroll">
                  <div className="cm-table">
                    {/* Header row */}
                    <div className="cm-row">
                      <div className="cm-corner"/>
                      {CLASS_LABELS.map((l, i) => (
                        <div key={i} className="cm-col-lbl" style={{ color: CLASS_COLORS[i] }}>
                          {l}
                        </div>
                      ))}
                    </div>
                    {/* Data rows */}
                    {info.confusion_matrix.map((row, ri) => {
                      const rowSum = row.reduce((a, b) => a + b, 0);
                      return (
                        <div className="cm-row" key={ri}>
                          <div className="cm-row-lbl" style={{ color: CLASS_COLORS[ri] }}>
                            {CLASS_LABELS[ri]}
                          </div>
                          {row.map((val, ci) => {
                            const pct = rowSum > 0 ? (val / rowSum) * 100 : 0;
                            const correct = ri === ci;
                            return (
                              <div
                                key={ci}
                                className={`cm-cell${correct ? ' correct' : ''}`}
                                style={{
                                  background: correct
                                    ? `rgba(74,222,128,${.08 + (pct / 100) * .35})`
                                    : val > 0 ? 'rgba(248,113,113,.08)' : 'transparent',
                                }}
                              >
                                <span className="cm-val">{val}</span>
                                <span className="cm-pct">{pct.toFixed(0)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Feature importances */}
            {topFeats.length > 0 && (
              <div className="sec-block">
                <h2>Feature Importance (Top 12)</h2>
                <p className="sec-sub">Kontribusi setiap fitur terhadap keputusan model — komponen Random Forest</p>
                <div className="fi-list">
                  {topFeats.map(([key, val], i) => (
                    <div className="fi-row" key={key}>
                      <span className="fi-rank">#{i + 1}</span>
                      <span className="fi-name">{FEAT_LABELS[key] || key}</span>
                      <div className="fi-bar-wrap">
                        <div
                          className="fi-bar"
                          style={{ width: `${(val / maxImp) * 100}%` }}
                        />
                      </div>
                      <span className="fi-pct">{(val * 100).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tech stack */}
        <div className="sec-block">
          <h2>Tech Stack</h2>
          <div className="tech-grid">
            {[
              { icon: '🐍', t: 'Python 3.10+',     d: 'Bahasa utama backend & ML pipeline' },
              { icon: '🌶️', t: 'Flask 3.x',         d: 'REST API framework — ringan & cepat' },
              { icon: '🔬', t: 'scikit-learn',      d: 'RandomForest, GradientBoosting, Pipeline, ColumnTransformer' },
              { icon: '⚛️', t: 'React 18',          d: 'Frontend SPA dengan hooks & state management' },
              { icon: '📊', t: 'NumPy + Pandas',    d: 'Pengolahan data dan feature engineering' },
              { icon: '🎨', t: 'CSS Variables',     d: 'Design system konsisten berbasis token warna' },
            ].map((t, i) => (
              <div className="tech-card" key={i}>
                <div className="tech-icon">{t.icon}</div>
                <div className="tech-t">{t.t}</div>
                <div className="tech-d">{t.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="about-cta">
          <button className="btn-primary lg" onClick={() => go('diagnosis')}>
            Coba Diagnosis Sekarang →
          </button>
        </div>

      </div>
    </div>
  );
}
