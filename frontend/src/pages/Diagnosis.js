import React, { useState } from 'react';
import './Diagnosis.css';

const API = process.env.REACT_APP_API_URL;

/* ─── Field definitions ──────────────────────────────────────────────────── */
const NUMERIC_FIELDS = [
  {
    key: 'age_months',
    label: 'Usia Anak',
    unit: 'bulan',
    min: 1, max: 120, step: 1, defaultVal: 24,
    hint: 'Usia anak saat kejang terjadi (1–120 bulan)',
    icon: '👶',
  },
  {
    key: 'temperature',
    label: 'Suhu Tubuh',
    unit: '°C',
    min: 35.0, max: 42.0, step: 0.1, defaultVal: 37.0,
    hint: 'Suhu tubuh diukur saat atau sesaat setelah kejang',
    icon: '🌡️',
  },
  {
    key: 'fever_duration_h',
    label: 'Lama Demam Sebelum Kejang',
    unit: 'jam',
    min: 0, max: 72, step: 0.5, defaultVal: 0,
    hint: 'Isi 0 jika tidak ada demam sebelum kejang',
    icon: '⏳',
  },
  {
    key: 'duration_minutes',
    label: 'Durasi Kejang',
    unit: 'menit',
    min: 0.5, max: 60, step: 0.5, defaultVal: 3,
    hint: 'Perkiraan lama kejang berlangsung',
    icon: '⏱️',
  },
];

const BINARY_GROUPS = [
  {
    title: 'Kondisi Sebelum Kejang',
    color: '#38d9f5',
    fields: [
      { key: 'fever_before',   label: 'Didahului Demam',     desc: 'Anak mengalami demam sebelum kejang terjadi' },
      { key: 'sudden_onset',   label: 'Muncul Mendadak',     desc: 'Kejang terjadi tiba-tiba tanpa tanda awal' },
    ],
  },
  {
    title: 'Pola & Karakteristik Kejang',
    color: '#fbbf24',
    fields: [
      { key: 'focal_movement',        label: 'Gerakan Fokal (Satu Sisi)', desc: 'Sentakan/kaku hanya pada satu sisi tubuh (tangan/kaki/wajah)' },
      { key: 'eye_deviation',         label: 'Mata Mendelik ke Satu Arah', desc: 'Bola mata berputar ke arah tertentu saat kejang' },
      { key: 'loss_of_consciousness', label: 'Hilang Kesadaran',          desc: 'Anak tidak responsif selama kejang berlangsung' },
      { key: 'recurrence_same_day',   label: 'Berulang dalam 24 Jam',     desc: 'Kejang terjadi lebih dari sekali dalam hari yang sama' },
      { key: 'cyanosis',              label: 'Bibir / Kulit Kebiruan',    desc: 'Sianosis — tanda kurangnya oksigen selama kejang' },
    ],
  },
  {
    title: 'Kondisi Setelah Kejang',
    color: '#4ade80',
    fields: [
      { key: 'postictal_drowsy', label: 'Sangat Mengantuk / Lemas', desc: 'Anak sulit dibangunkan atau sangat lemas setelah kejang' },
    ],
  },
  {
    title: 'Riwayat & Faktor Risiko',
    color: '#a78bfa',
    fields: [
      { key: 'family_history',       label: 'Riwayat Keluarga Kejang/Epilepsi', desc: 'Ada anggota keluarga inti yang pernah kejang atau didiagnosis epilepsi' },
      { key: 'prior_seizure',        label: 'Pernah Kejang Sebelumnya',         desc: 'Anak pernah mengalami episode kejang sebelumnya' },
      { key: 'developmental_delay',  label: 'Keterlambatan Tumbuh Kembang',     desc: 'Ada keterlambatan bicara, motorik, atau perkembangan dibanding anak seusianya' },
    ],
  },
];

const DEFAULT_NUM = Object.fromEntries(NUMERIC_FIELDS.map(f => [f.key, f.defaultVal]));
const DEFAULT_BIN = Object.fromEntries(
  BINARY_GROUPS.flatMap(g => g.fields.map(f => [f.key, 0]))
);

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function Diagnosis({ go }) {
  const [num, setNum]     = useState(DEFAULT_NUM);
  const [bin, setBin]     = useState(DEFAULT_BIN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setN = (k, v) => setNum(p => ({ ...p, [k]: v }));
  const toggleB = (k)  => setBin(p => ({ ...p, [k]: p[k] ? 0 : 1 }));
  const reset = () => { setNum(DEFAULT_NUM); setBin(DEFAULT_BIN); setError(''); };

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = { input: { ...num, ...bin } };
      const res = await fetch(`${API}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      go('result', data);
    } catch (e) {
      setError(`Gagal menghubungi server: ${e.message}. Pastikan backend Python berjalan di port 5000.`);
    } finally {
      setLoading(false);
    }
  };

  const binaryCount = Object.values(bin).filter(Boolean).length;

  return (
    <div className="diag-page">
      <div className="diag-wrap">

        {/* Header */}
        <div className="diag-hdr">
          <span className="diag-chip">Formulir Diagnosis</span>
          <h1>Isi Data Kondisi Kejang</h1>
          <p>
            Masukkan data anak selengkap mungkin. Sistem akan menganalisis pola
            dan mengklasifikasikan kondisi kejang berdasarkan data yang diberikan.
          </p>
        </div>

        <div className="diag-body">

          {/* ── Numerik ── */}
          <div className="section-block">
            <div className="block-title">
              <span className="block-num">1</span>
              Data Numerik Anak
            </div>
            <div className="num-grid">
              {NUMERIC_FIELDS.map(f => (
                <div className="num-card" key={f.key}>
                  <div className="num-label-row">
                    <span className="num-icon">{f.icon}</span>
                    <label>{f.label}</label>
                  </div>
                  <div className="num-input-row">
                    <input
                      type="number"
                      min={f.min} max={f.max} step={f.step}
                      value={num[f.key]}
                      onChange={e => setN(f.key, parseFloat(e.target.value) || 0)}
                    />
                    <span className="num-unit">{f.unit}</span>
                  </div>
                  <input
                    type="range" min={f.min} max={f.max} step={f.step}
                    value={num[f.key]}
                    onChange={e => setN(f.key, parseFloat(e.target.value))}
                    className="range-slider"
                  />
                  <p className="num-hint">{f.hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Binary ── */}
          <div className="section-block">
            <div className="block-title">
              <span className="block-num">2</span>
              Gejala & Kondisi yang Diamati
              <span className="block-count">{binaryCount} dipilih</span>
            </div>

            {BINARY_GROUPS.map(g => (
              <div className="bin-group" key={g.title} style={{ '--gc': g.color }}>
                <div className="bin-group-title">{g.title}</div>
                <div className="bin-fields">
                  {g.fields.map(f => (
                    <button
                      key={f.key}
                      className={`bin-card ${bin[f.key] ? 'on' : ''}`}
                      onClick={() => toggleB(f.key)}
                    >
                      <div className="bin-check">
                        {bin[f.key] && (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="bin-text">
                        <span className="bin-label">{f.label}</span>
                        <span className="bin-desc">{f.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Error ── */}
          {error && <div className="err-box"><span>⚠</span>{error}</div>}

          {/* ── Actions ── */}
          <div className="diag-actions">
            <button className="btn-reset" onClick={reset}>↺ Reset</button>
            <button
              className={`btn-primary lg${loading ? ' loading' : ''}`}
              onClick={submit}
              disabled={loading}
            >
              {loading
                ? <><span className="spin"/><span>Menganalisis...</span></>
                : <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Diagnosa Sekarang
                  </>
              }
            </button>
          </div>

          <div className="disclaimer">
            <strong>⚠️ Perhatian:</strong> Sistem ini merupakan alat bantu skrining awal untuk keperluan
            penelitian dan informasi. Hasil yang ditampilkan <strong>bukan diagnosis medis resmi</strong>.
            Selalu konsultasikan kondisi anak kepada dokter spesialis anak atau neurolog.
          </div>

        </div>
      </div>
    </div>
  );
}
