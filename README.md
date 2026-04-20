# NeuraScan v2 — Sistem Klasifikasi Kondisi Kejang pada Anak

Sistem berbasis **Machine Learning** untuk mengklasifikasikan kondisi kejang pada anak
berdasarkan usia, suhu tubuh, durasi, dan gejala klinis yang diamati.

**Stack:** React JS · Python Flask · scikit-learn  
**Algoritma:** Voting Ensemble — Random Forest (300 tree) + Gradient Boosting (200 estimator)  
**Akurasi:** 99.17% | F1: 99.16% | CV 5-Fold: 97.67% ± 0.86%

---

## Tiga Kategori Output

| ID | Label                    | Keterangan                                      |
|----|--------------------------|--------------------------------------------------|
| 0  | Kejang Demam Sederhana   | Demam + durasi <15 mnt + tidak fokal/berulang   |
| 1  | Kejang Demam Kompleks    | Demam + (≥15 mnt ATAU fokal ATAU berulang 24j)  |
| 2  | Kejang Tanpa Demam       | Suhu normal, tidak didahului demam               |

---

## Struktur Proyek

```
seizure-v2/
├── backend/
│   ├── app.py                  ← Flask REST API (3 endpoint)
│   ├── train_model.py          ← Training pipeline RF+GBM
│   ├── generate_dataset.py     ← Generate 1200 sampel klinis sintetik
│   ├── requirements.txt
│   ├── data/
│   │   └── seizure_dataset.csv ← (auto-generated)
│   └── model/
│       ├── seizure_model.pkl   ← (auto-generated)
│       └── metadata.json       ← (auto-generated)
│
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.js / App.css
    │   ├── index.js / index.css
    │   ├── components/
    │   │   ├── Header.js / Header.css
    │   └── pages/
    │       ├── Home.js / Home.css
    │       ├── Diagnosis.js / Diagnosis.css
    │       ├── Result.js / Result.css
    │       └── About.js / About.css
    ├── package.json
    └── .env
```

---

## LANGKAH 1 — Setup Backend Python

### 1.1 Masuk folder backend
```bash
cd seizure-v2/backend
```

### 1.2 Buat virtual environment (sangat disarankan)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 1.3 Install dependencies
```bash
pip install flask scikit-learn numpy pandas
```
> Tidak perlu flask-cors — CORS sudah ditangani manual di app.py

### 1.4 Generate dataset & latih model
```bash
python generate_dataset.py
python train_model.py
```

Output yang diharapkan:
```
Dataset berhasil dibuat: 1200 baris
Accuracy : 0.9917
F1 Score : 0.9916
CV Accuracy: 0.9767 ± 0.0086
Model disimpan → model/seizure_model.pkl
```

### 1.5 Jalankan server Flask
```bash
python app.py
```
Server berjalan di `http://localhost:5000`

**Verifikasi:**
```bash
curl http://localhost:5000/api/health
# → {"model_loaded": true, "status": "ok"}
```

---

## LANGKAH 2 — Setup Frontend React

Buka **terminal baru** (backend tetap jalan).

### 2.1 Masuk folder frontend
```bash
cd seizure-v2/frontend
```

### 2.2 Install node modules
```bash
npm install
```
Jika ada warning peer-dependency:
```bash
npm install --legacy-peer-deps
```

### 2.3 Cek konfigurasi .env
File `.env` sudah ada:
```
REACT_APP_API_URL=http://localhost:5000
```
Ubah port jika backend berjalan di port berbeda.

### 2.4 Jalankan React
```bash
npm start
```
Buka browser: `http://localhost:3000`

---

## API Endpoints

| Method | URL                | Keterangan                           |
|--------|--------------------|--------------------------------------|
| GET    | `/api/health`      | Cek status server & model            |
| POST   | `/api/predict`     | Prediksi dari input data             |
| GET    | `/api/model-info`  | Metrik, confusion matrix, feat imp.  |

### Contoh POST `/api/predict`
```json
{
  "input": {
    "age_months": 24,
    "temperature": 39.5,
    "fever_before": 1,
    "fever_duration_h": 6.0,
    "duration_minutes": 3.0,
    "focal_movement": 0,
    "recurrence_same_day": 0,
    "postictal_drowsy": 0,
    "eye_deviation": 0,
    "loss_of_consciousness": 1,
    "cyanosis": 0,
    "family_history": 0,
    "prior_seizure": 0,
    "developmental_delay": 0,
    "sudden_onset": 0
  }
}
```

### Contoh Response
```json
{
  "prediction": {
    "label_id": 0,
    "label": "Kejang Demam Sederhana",
    "label_en": "Simple Febrile Seizure",
    "confidence": 99.99
  },
  "specific_diagnosis": {
    "name_id": "Kejang Demam Sederhana Tipikal",
    "name_en": "Simple Febrile Seizure",
    "description": "...",
    "recommendations": ["..."]
  },
  "class_probabilities": [...],
  "model_metrics": {...}
}
```

---

## Troubleshooting

### ❌ `ModuleNotFoundError: No module named 'flask'`
```bash
pip install flask scikit-learn numpy pandas
```

### ❌ `Model belum ada. Jalankan: python train_model.py`
```bash
python generate_dataset.py
python train_model.py
```

### ❌ Frontend tidak bisa konek backend (Network Error)
1. Pastikan `python app.py` berjalan
2. Cek `.env`: `REACT_APP_API_URL=http://localhost:5000`
3. Restart `npm start` setelah ubah `.env`

### ❌ Port 5000 sudah dipakai (macOS — AirPlay Receiver)
Edit baris terakhir `app.py`:
```python
app.run(debug=True, host="0.0.0.0", port=5001)
```
Update `.env` frontend:
```
REACT_APP_API_URL=http://localhost:5001
```

### ❌ `npm install` error dependency
```bash
npm install --legacy-peer-deps
```

---

## Produksi (Opsional)

### Backend
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend
```bash
npm run build
npx serve -s build -l 3000
```

---

## Algoritma — Justifikasi

| Aspek           | Pilihan                      | Alasan                                          |
|-----------------|------------------------------|-------------------------------------------------|
| Model           | RF + GBM Voting Ensemble     | Terbaik untuk data tabular kecil–menengah       |
| vs Deep Learning| Ensemble lebih unggul        | DL butuh >>10K data untuk menyaingi tree model  |
| Preprocessing   | StandardScaler (numerik)     | Suhu, usia, durasi punya skala berbeda          |
| Fitur numerik   | age_months, temperature, dll | Nilai kontinu yang berskala penting             |
| Fitur biner     | 11 gejala klinis             | Ya/tidak berdasarkan observasi orang tua        |
| Validasi        | Stratified 5-Fold CV         | Mencegah overfitting, distribusi label merata   |

---

*NeuraScan v2.0 · Penulisan Ilmiah Universitas Gunadarma*  
*Tema: Klasifikasi Kondisi Kejang pada Anak Berbasis Machine Learning*
