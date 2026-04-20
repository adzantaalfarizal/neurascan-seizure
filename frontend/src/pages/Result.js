import React, { useEffect, useRef } from 'react';
import './Result.css';

const LABEL_CFG = {
  0: {
    label:  'Kejang Demam Sederhana',
    en:     'Simple Febrile Seizure',
    color:  '#38d9f5',
    bg:     'rgba(56,217,245,.09)',
    border: 'rgba(56,217,245,.25)',
    icon:   '🌡️',
  },
  1: {
    label:  'Kejang Demam Kompleks',
    en:     'Complex Febrile Seizure',
    color:  '#fbbf24',
    bg:     'rgba(251,191,36,.09)',
    border: 'rgba(251,191,36,.25)',
    icon:   '⚠️',
  },
  2: {
    label:  'Kejang Tanpa Demam',
    en:     'Afebrile Seizure',
    color:  '#a78bfa',
    bg:     'rgba(167,139,250,.09)',
    border: 'rgba(167,139,250,.25)',
    icon:   '🧠',
  },
};

/* Animated progress bar */
function Bar({ value, color }) {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (ref.current) ref.current.style.width = `${value}%`;
    }, 120);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="bar-bg">
      <div className="bar-fill" ref={ref} style={{ background: color }} />
    </div>
  );
}

/* Animated SVG circle */
function ConfCircle({ pct, color }) {
  const R = 50;
  const C = 2 * Math.PI * R;
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (ref.current) ref.current.style.strokeDashoffset = `${C * (1 - pct / 100)}`;
    }, 150);
    return () => clearTimeout(t);
  }, [pct, C]);
  return (
    <div className="conf-circle">
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10"/>
        <circle
          ref={ref}
          cx="60" cy="60" r={R} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="conf-inner">
        <span className="conf-pct">{pct}%</span>
        <span className="conf-word" style={{ color }}>
          {pct >= 90 ? 'Sangat Tinggi' : pct >= 75 ? 'Tinggi' : pct >= 55 ? 'Sedang' : 'Rendah'}
        </span>
      </div>
    </div>
  );
}

export default function Result({ result, go }) {
  if (!result) {
    return (
      <div className="result-empty">
        <p>Tidak ada hasil. Silakan lakukan diagnosis terlebih dahulu.</p>
        <button className="btn-ghost" onClick={() => go('diagnosis')}>← Kembali</button>
      </div>
    );
  }

  const { prediction, specific_diagnosis, class_probabilities, model_metrics } = result;
  const cfg = LABEL_CFG[prediction.label_id] ?? LABEL_CFG[0];

  return (
    <div className="result-page">
      <div className="result-wrap">

        {/* Back */}
        <button className="back-btn" onClick={() => go('diagnosis')}>← Ubah Data</button>

        {/* ── Hero card ── */}
        <div className="result-hero" style={{ '--rc': cfg.color, '--rbg': cfg.bg, '--rbd': cfg.border }}>
          <div className="rh-left">
            <div className="rh-icon-wrap">
              <div className="rh-pulse"/>
              <span className="rh-icon">{cfg.icon}</span>
            </div>
            <div className="rh-text">
              <div className="rh-meta">Hasil Klasifikasi ML</div>
              <h1 className="rh-label">{prediction.label}</h1>
              <div className="rh-en">{prediction.label_en}</div>
            </div>
          </div>
          <ConfCircle pct={prediction.confidence} color={cfg.color} />
        </div>

        <div className="result-cols">

          {/* ── Left col ── */}
          <div className="result-left">

            {/* Specific diagnosis */}
            <div className="rcard">
              <div className="rcard-head">
                <span className="rcard-icon">🔬</span>
                <div>
                  <div className="rcard-title">Diagnosis Spesifik</div>
                  <div className="rcard-sub">Berdasarkan pola data yang dimasukkan</div>
                </div>
              </div>
              <div className="dx-name" style={{ color: cfg.color }}>{specific_diagnosis.name_id}</div>
              <div className="dx-en">{specific_diagnosis.name_en}</div>
              <p className="dx-desc">{specific_diagnosis.description}</p>

              {/* Recommendations */}
              <div className="rec-box">
                <div className="rec-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.2">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                  Langkah Penanganan Awal
                </div>
                <ol className="rec-list">
                  {specific_diagnosis.recommendations.map((r, i) => (
                    <li key={i}>
                      <span className="rec-num">{i + 1}</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

          </div>

          {/* ── Right col ── */}
          <div className="result-right">

            {/* Probability distribution */}
            <div className="rcard">
              <div className="rcard-head">
                <span className="rcard-icon">📊</span>
                <div>
                  <div className="rcard-title">Distribusi Probabilitas</div>
                  <div className="rcard-sub">Confidence tiap kategori</div>
                </div>
              </div>
              <div className="prob-list">
                {[...class_probabilities]
                  .sort((a, b) => b.probability - a.probability)
                  .map(cp => {
                    const c = LABEL_CFG[cp.label_id];
                    const isWinner = cp.label_id === prediction.label_id;
                    return (
                      <div key={cp.label_id} className={`prob-item${isWinner ? ' winner' : ''}`}>
                        <div className="prob-row">
                          <span className="prob-icon">{c.icon}</span>
                          <span className="prob-label">{cp.label}</span>
                          <span className="prob-pct" style={{ color: c.color }}>
                            {cp.probability}%
                          </span>
                        </div>
                        <Bar value={cp.probability} color={c.color} />
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Model metrics */}
            {model_metrics && (
              <div className="rcard">
                <div className="rcard-head">
                  <span className="rcard-icon">🤖</span>
                  <div>
                    <div className="rcard-title">Performa Model</div>
                    <div className="rcard-sub">Random Forest + Gradient Boosting Ensemble</div>
                  </div>
                </div>
                <div className="metrics-grid">
                  {[
                    { k: 'accuracy',  l: 'Akurasi' },
                    { k: 'f1_score',  l: 'F1 Score' },
                    { k: 'precision', l: 'Presisi' },
                    { k: 'recall',    l: 'Recall' },
                  ].map(m => (
                    <div className="metric-box" key={m.k}>
                      <div className="metric-val">
                        {((model_metrics[m.k] || 0) * 100).toFixed(1)}%
                      </div>
                      <div className="metric-lbl">{m.l}</div>
                    </div>
                  ))}
                </div>
                {model_metrics.cv_accuracy_mean && (
                  <div className="cv-row">
                    CV 5-Fold: <strong>{(model_metrics.cv_accuracy_mean * 100).toFixed(1)}%</strong>
                    &nbsp;± {(model_metrics.cv_accuracy_std * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            )}

            {/* Input summary */}
            <div className="rcard input-summary">
              <div className="rcard-head">
                <span className="rcard-icon">📋</span>
                <div>
                  <div className="rcard-title">Ringkasan Input</div>
                  <div className="rcard-sub">Data yang digunakan untuk prediksi</div>
                </div>
              </div>
              <div className="summary-note">
                Gunakan tombol di bawah untuk mengubah data dan menjalankan ulang prediksi.
              </div>
              <button className="btn-ghost full" onClick={() => go('diagnosis')}>
                ← Ubah Data & Prediksi Ulang
              </button>
            </div>

          </div>
        </div>

        {/* Disclaimer */}
        <div className="result-disclaimer">
          <strong>⚠️ Peringatan Penting:</strong> Hasil di atas adalah keluaran model machine learning
          untuk keperluan <strong>skrining awal</strong> dan penelitian akademik. Hasil ini <strong>bukan
          diagnosis medis resmi</strong> dan tidak dapat menggantikan pemeriksaan langsung oleh dokter
          spesialis anak atau neurolog. Segera konsultasikan kondisi anak kepada tenaga medis profesional.
        </div>

        {/* Actions */}
        <div className="result-actions">
          <button className="btn-ghost" onClick={() => go('diagnosis')}>← Diagnosis Ulang</button>
          <button className="btn-ghost" onClick={() => go('home')}>Beranda</button>
          <button className="btn-ghost" onClick={() => go('about')}>Tentang Model</button>
        </div>

      </div>
    </div>
  );
}
