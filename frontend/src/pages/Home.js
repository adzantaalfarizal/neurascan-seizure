import React from 'react';
import './Home.css';

const STATS = [
  { v: '99%',  l: 'Akurasi Model',    s: '5-Fold Cross Validated' },
  { v: '15',   l: 'Fitur Input',       s: 'Klinis & demografis' },
  { v: '3',    l: 'Kategori Kejang',   s: 'Berdasarkan kondisi' },
  { v: '1200', l: 'Data Latih',        s: 'Sintetik klinis terstruktur' },
];

const TYPES = [
  {
    key: 'simple',
    color: 'var(--c-simple)',
    bg: 'rgba(56,217,245,.08)',
    border: 'rgba(56,217,245,.22)',
    icon: '🌡️',
    badge: 'Simple Febrile Seizure',
    title: 'Kejang Demam Sederhana',
    desc: 'Kejang yang dipicu demam tinggi, berlangsung < 15 menit, bersifat umum (tidak fokal), dan tidak berulang dalam 24 jam. Paling umum pada anak 6 bulan–5 tahun.',
    items: ['Suhu tubuh ≥ 38.5°C', 'Didahului demam', 'Durasi < 15 menit', 'Tidak fokal, tidak berulang'],
  },
  {
    key: 'complex',
    color: 'var(--c-complex)',
    bg: 'rgba(251,191,36,.08)',
    border: 'rgba(251,191,36,.22)',
    icon: '⚠️',
    badge: 'Complex Febrile Seizure',
    title: 'Kejang Demam Kompleks',
    desc: 'Kejang demam dengan salah satu ciri: durasi ≥ 15 menit, gerakan fokal (satu sisi), atau berulang dalam 24 jam. Memerlukan evaluasi neurologis lebih lanjut.',
    items: ['Durasi ≥ 15 menit', 'Gerakan fokal (satu sisi)', 'Berulang dalam 24 jam', 'Risiko epilepsi lebih tinggi'],
  },
  {
    key: 'afebrile',
    color: 'var(--c-afebrile)',
    bg: 'rgba(167,139,250,.08)',
    border: 'rgba(167,139,250,.22)',
    icon: '🧠',
    badge: 'Afebrile Seizure',
    title: 'Kejang Tanpa Demam',
    desc: 'Kejang yang terjadi tanpa didahului demam. Suhu tubuh normal. Sering terkait epilepsi atau kelainan neurologis yang memerlukan pemeriksaan EEG dan MRI otak.',
    items: ['Suhu tubuh normal (< 38°C)', 'Tidak didahului demam', 'Bisa fokal atau umum', 'Terkait epilepsi / kelainan otak'],
  },
];

const FEATURES = [
  { icon: '🌡️', t: 'Berbasis Suhu & Demam', d: 'Input suhu tubuh, riwayat demam, dan durasi demam sebelum kejang untuk analisis akurat.' },
  { icon: '👶', t: 'Konteks Usia Anak',     d: 'Usia dalam bulan menjadi faktor kunci — profil kejang berbeda signifikan antar kelompok usia.' },
  { icon: '⏱️', t: 'Durasi & Pola Kejang',  d: 'Durasi, gerakan fokal, dan kejang berulang menentukan apakah kejang sederhana atau kompleks.' },
  { icon: '⚡', t: 'Prediksi Real-time',    d: 'Hasil klasifikasi dan rekomendasi klinis ditampilkan dalam hitungan detik.' },
  { icon: '📋', t: 'Rekomendasi Klinis',    d: 'Setiap hasil dilengkapi langkah penanganan awal yang dapat dipahami orang tua.' },
  { icon: '🛡️', t: 'Hanya Alat Bantu',     d: 'Dirancang sebagai skrining awal — tidak menggantikan diagnosis dokter.' },
];

export default function Home({ go }) {
  return (
    <div className="home">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="orb orb1"/>
          <div className="orb orb2"/>
          <div className="grid-overlay"/>
        </div>
        <div className="hero-body">
          <div className="hero-chip">
            <span className="chip-dot"/>
            Berbasis Machine Learning · Ensemble RF + GBM
          </div>
          <h1>
            Klasifikasi Kondisi<br/>
            <span className="hero-grad">Kejang pada Anak</span>
          </h1>
          <p className="hero-sub">
            Masukkan data usia, suhu tubuh, dan kondisi kejang anak — sistem akan
            mengklasifikasikan apakah kejang bersifat <strong>demam sederhana</strong>,
            <strong> demam kompleks</strong>, atau <strong>tanpa demam</strong>, beserta
            rekomendasi klinis yang sesuai.
          </p>
          <div className="hero-btns">
            <button className="btn-primary lg" onClick={() => go('diagnosis')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Mulai Diagnosis
            </button>
            <button className="btn-ghost" onClick={() => go('about')}>
              Lihat Performa Model
            </button>
          </div>
          <p className="hero-disclaimer">⚠️ Alat bantu skrining awal — bukan pengganti diagnosis medis.</p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-row">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div className="stat" key={i}>
                <div className="stat-v">{s.v}</div>
                <div className="stat-l">{s.l}</div>
                <div className="stat-s">{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Types ── */}
      <section className="types-section">
        <div className="container">
          <div className="sec-head">
            <h2>Tiga Kategori Klasifikasi</h2>
            <p>Sistem mengklasifikasikan kondisi kejang berdasarkan gejala, suhu, dan pola kejadian</p>
          </div>
          <div className="types-grid">
            {TYPES.map(t => (
              <div className="type-card" key={t.key}
                style={{ '--tc': t.color, '--tbg': t.bg, '--tbd': t.border }}>
                <div className="type-top">
                  <span className="type-badge">{t.badge}</span>
                  <span className="type-icon">{t.icon}</span>
                </div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
                <ul>
                  {t.items.map((item, i) => (
                    <li key={i}><span className="dot"/>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="feat-section">
        <div className="container">
          <div className="sec-head">
            <h2>Fitur Sistem</h2>
            <p>Dibangun untuk mendukung deteksi dini kondisi kejang pada anak</p>
          </div>
          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <div className="feat-card" key={i}>
                <div className="feat-icon">{f.icon}</div>
                <h4>{f.t}</h4>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-glow"/>
            <h2>Mulai Skrining Sekarang</h2>
            <p>Isi data gejala anak dan dapatkan hasil klasifikasi beserta panduan tindakan awal.</p>
            <button className="btn-primary lg" onClick={() => go('diagnosis')}>
              Mulai Diagnosis →
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
