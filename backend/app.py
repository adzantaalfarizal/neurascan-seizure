"""
app.py  —  NeuraScan Backend API
Flask REST API untuk sistem klasifikasi kondisi kejang pada anak.
"""

import os
import json
import pickle
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

# ── Manual CORS (tanpa flask-cors) ────────────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

@app.before_request
def handle_preflight():
    from flask import request as req
    if req.method == "OPTIONS":
        from flask import Response
        r = Response()
        r.headers["Access-Control-Allow-Origin"]  = "*"
        r.headers["Access-Control-Allow-Headers"] = "Content-Type"
        r.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        return r

# ── Load artifacts ─────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH  = os.path.join(BASE_DIR, "model", "seizure_model.pkl")
META_PATH   = os.path.join(BASE_DIR, "model", "metadata.json")

model    = None
metadata = None

def load_artifacts():
    global model, metadata
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "Model belum ada. Jalankan: python train_model.py"
        )
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(META_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    print("✓ Model dan metadata berhasil dimuat.")

# ── Konstanta diagnosis ────────────────────────────────────────────────────────
DIAGNOSES = {
    0: [
        {
            "name_id": "Kejang Demam Sederhana Tipikal",
            "name_en": "Simple Febrile Seizure",
            "conditions": ["fever_before", "loss_of_consciousness"],
            "threshold": 1,
            "description": (
                "Kejang yang dipicu oleh kenaikan suhu tubuh mendadak, berlangsung "
                "kurang dari 15 menit, bersifat umum (tidak fokal), dan tidak berulang "
                "dalam 24 jam. Paling sering terjadi pada anak usia 6 bulan–5 tahun. "
                "Umumnya jinak dan tidak menyebabkan kerusakan otak."
            ),
            "recommendations": [
                "Baringkan anak miring agar tidak tersedak jika muntah",
                "Longgarkan pakaian dan beri ruang udara yang cukup",
                "Kompres hangat dan berikan antipiretik (parasetamol/ibuprofen) sesuai dosis",
                "Jangan memasukkan benda apapun ke mulut anak selama kejang",
                "Bawa ke dokter/puskesmas setelah kejang untuk mencari penyebab demam",
                "Konsultasikan kepada dokter tentang penyediaan diazepam rektal di rumah",
            ],
        },
    ],
    1: [
        {
            "name_id": "Kejang Demam Kompleks — Fokal",
            "name_en": "Complex Febrile Seizure (Focal)",
            "conditions": ["fever_before", "focal_movement", "eye_deviation"],
            "threshold": 2,
            "description": (
                "Varian kejang demam kompleks di mana gerakan kejang hanya melibatkan "
                "satu sisi tubuh atau mata mendelik ke satu arah. Menandakan aktivitas "
                "epileptik dari satu area otak dan memerlukan evaluasi neurologis."
            ),
            "recommendations": [
                "Rekam video episode untuk ditunjukkan kepada dokter",
                "EEG dan MRI otak sangat dianjurkan",
                "Konsultasi neurolog anak untuk menentukan perlu tidaknya obat anti-epilepsi",
                "Cari penyebab demam secara menyeluruh (infeksi virus, bakteri, dll.)",
                "Pemantauan tumbuh kembang anak secara rutin",
            ],
        },
        {
            "name_id": "Kejang Demam Kompleks — Berulang",
            "name_en": "Complex Febrile Seizure (Recurrent)",
            "conditions": ["fever_before", "recurrence_same_day"],
            "threshold": 2,
            "description": (
                "Kejang demam yang terjadi lebih dari sekali dalam 24 jam yang sama. "
                "Memerlukan observasi ketat dan evaluasi penyebab demam yang lebih dalam, "
                "termasuk kemungkinan meningitis atau ensefalitis."
            ),
            "recommendations": [
                "Rawat inap untuk observasi dan investigasi penyebab demam",
                "Pemeriksaan darah lengkap, elektrolit, dan jika perlu pungsi lumbal",
                "EEG setelah kondisi stabil",
                "Diskusi dengan neurolog anak mengenai profilaksis kejang",
                "Edukasi orang tua tentang tanda bahaya dan cara penanganan di rumah",
            ],
        },
        {
            "name_id": "Kejang Demam Kompleks — Durasi Panjang",
            "name_en": "Complex Febrile Seizure (Prolonged)",
            "conditions": ["fever_before", "postictal_drowsy", "loss_of_consciousness"],
            "threshold": 2,
            "description": (
                "Kejang demam yang berlangsung ≥15 menit. Memerlukan evaluasi lebih mendalam "
                "karena risiko epilepsi di kemudian hari lebih tinggi dibanding "
                "kejang demam sederhana."
            ),
            "recommendations": [
                "Segera ke IGD jika kejang berlangsung lebih dari 5 menit tanpa berhenti",
                "EEG direkomendasikan untuk evaluasi aktivitas otak",
                "MRI otak jika ada defisit neurologis atau kejang fokal",
                "Diskusikan dengan neurolog anak tentang rencana tatalaksana jangka panjang",
                "Pastikan tersedia diazepam rektal sebagai pertolongan pertama di rumah",
            ],
        },
    ],
    2: [
        {
            "name_id": "Kejang Epileptik Fokal Tanpa Demam",
            "name_en": "Focal Epileptic Seizure (Afebrile)",
            "conditions": ["focal_movement", "eye_deviation", "sudden_onset"],
            "threshold": 2,
            "description": (
                "Kejang tanpa demam yang menunjukkan pola fokal — gerakan atau gejala "
                "hanya pada satu sisi tubuh. Sering merupakan manifestasi epilepsi dari "
                "area korteks tertentu. Perlu investigasi penyebab struktural."
            ),
            "recommendations": [
                "Konsultasi segera ke neurolog anak",
                "EEG lengkap termasuk pemeriksaan saat tidur",
                "MRI otak protokol epilepsi untuk mencari kelainan struktural",
                "Buat catatan harian kejang (tanggal, waktu, durasi, pola)",
                "Diskusikan pemberian obat anti-epilepsi dengan dokter spesialis",
            ],
        },
        {
            "name_id": "Kejang Epileptik Umum Tanpa Demam",
            "name_en": "Generalized Epileptic Seizure (Afebrile)",
            "conditions": ["loss_of_consciousness", "sudden_onset"],
            "threshold": 2,
            "description": (
                "Kejang yang melibatkan seluruh tubuh tanpa didahului demam. Hilangnya "
                "kesadaran terjadi mendadak dan dapat disertai kekakuan atau sentakan. "
                "Memerlukan evaluasi epilepsi secara komprehensif."
            ),
            "recommendations": [
                "Segera ke IGD jika kejang berlangsung lebih dari 5 menit",
                "Pemeriksaan EEG untuk mengidentifikasi tipe epilepsi",
                "MRI atau CT otak untuk menyingkirkan penyebab struktural",
                "Evaluasi laboratorium: elektrolit, gula darah, fungsi hati dan ginjal",
                "Konsultasi neurolog anak untuk rencana terapi jangka panjang",
            ],
        },
        {
            "name_id": "Kejang Tanpa Demam — Riwayat Epilepsi",
            "name_en": "Afebrile Seizure with Epilepsy History",
            "conditions": ["prior_seizure", "family_history"],
            "threshold": 2,
            "description": (
                "Kejang berulang tanpa demam pada anak dengan riwayat kejang sebelumnya "
                "atau riwayat keluarga dengan epilepsi. Kemungkinan besar merupakan "
                "epilepsi yang memerlukan terapi jangka panjang."
            ),
            "recommendations": [
                "Evaluasi efektivitas dan kepatuhan terapi anti-epilepsi yang ada",
                "EEG ulang untuk memantau pola aktivitas otak",
                "Tinjau kembali dosis obat bersama neurolog anak",
                "Hindari faktor pencetus: kurang tidur, stres, cahaya berkedip",
                "Dukungan psikologis untuk anak dan keluarga",
                "Pertimbangkan konseling genetik jika riwayat keluarga kuat",
            ],
        },
    ],
}

FEATURES = [
    "age_months", "temperature", "fever_before", "fever_duration_h",
    "duration_minutes", "focal_movement", "recurrence_same_day",
    "postictal_drowsy", "eye_deviation", "loss_of_consciousness",
    "cyanosis", "family_history", "prior_seizure", "developmental_delay",
    "sudden_onset",
]


def pick_diagnosis(label: int, data: dict) -> dict:
    candidates = DIAGNOSES[label]
    best, best_score = None, -1
    for dx in candidates:
        score = sum(1 for c in dx["conditions"] if data.get(c, 0) == 1)
        if score >= dx["threshold"] and score > best_score:
            best_score, best = score, dx
    return best if best else candidates[0]


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


@app.route("/api/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model belum dimuat"}), 503

    body = request.get_json(force=True)
    inp  = body.get("input", {})

    # Build DataFrame dengan urutan fitur yang benar
    import pandas as pd
    row = {f: float(inp.get(f, 0)) for f in FEATURES}
    X   = pd.DataFrame([row], columns=FEATURES)

    pred_label = int(model.predict(X)[0])
    proba      = model.predict_proba(X)[0].tolist()

    label_names = {int(k): v for k, v in metadata["label_names"].items()}
    label_en    = {int(k): v for k, v in metadata["label_en"].items()}

    dx = pick_diagnosis(pred_label, inp)

    class_probs = [
        {
            "label_id":   i,
            "label":      label_names.get(i, f"Kelas {i}"),
            "label_en":   label_en.get(i, ""),
            "probability": round(proba[i] * 100, 2),
        }
        for i in range(len(proba))
    ]

    return jsonify({
        "prediction": {
            "label_id":  pred_label,
            "label":     label_names[pred_label],
            "label_en":  label_en[pred_label],
            "confidence": round(max(proba) * 100, 2),
        },
        "specific_diagnosis": {
            "name_id":        dx["name_id"],
            "name_en":        dx["name_en"],
            "description":    dx["description"],
            "recommendations": dx["recommendations"],
        },
        "class_probabilities": class_probs,
        "model_metrics":       metadata["metrics"],
    })


@app.route("/api/model-info", methods=["GET"])
def model_info():
    if metadata is None:
        return jsonify({"error": "Metadata tidak tersedia"}), 503
    return jsonify({
        "metrics":              metadata["metrics"],
        "feature_importances":  metadata.get("feature_importances", {}),
        "confusion_matrix":     metadata.get("confusion_matrix", []),
        "label_names":          metadata["label_names"],
    })


# ── Main ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    load_artifacts()
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
