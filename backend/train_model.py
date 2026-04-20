"""
train_model.py
==============
Melatih model klasifikasi kondisi kejang pada anak.

Algoritma: Voting Ensemble (Random Forest + Gradient Boosting, Soft Voting)
Pipeline: StandardScaler untuk fitur numerik + model ensemble
"""

import os
import json
import pickle
import warnings
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    VotingClassifier,
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import FunctionTransformer
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    classification_report,
    confusion_matrix,
)

warnings.filterwarnings("ignore")

# ── Konstanta ──────────────────────────────────────────────────────────────────

FEATURES = [
    "age_months",
    "temperature",
    "fever_before",
    "fever_duration_h",
    "duration_minutes",
    "focal_movement",
    "recurrence_same_day",
    "postictal_drowsy",
    "eye_deviation",
    "loss_of_consciousness",
    "cyanosis",
    "family_history",
    "prior_seizure",
    "developmental_delay",
    "sudden_onset",
]

NUMERIC_FEATURES = ["age_months", "temperature", "fever_duration_h", "duration_minutes"]
BINARY_FEATURES  = [f for f in FEATURES if f not in NUMERIC_FEATURES]

LABEL_NAMES = {
    0: "Kejang Demam Sederhana",
    1: "Kejang Demam Kompleks",
    2: "Kejang Tanpa Demam",
}
LABEL_EN = {
    0: "Simple Febrile Seizure",
    1: "Complex Febrile Seizure",
    2: "Afebrile Seizure",
}

# ── Spesifikasi diagnosis per label ───────────────────────────────────────────

DIAGNOSES = {
    0: [
        {
            "name_id": "Kejang Demam Sederhana Tipikal",
            "name_en": "Simple Febrile Seizure",
            "conditions": ["fever_before", "loss_of_consciousness"],
            "threshold": 2,
            "description": (
                "Kejang yang dipicu oleh kenaikan suhu tubuh mendadak, berlangsung "
                "kurang dari 15 menit, bersifat umum (tidak fokal), dan tidak berulang "
                "dalam 24 jam. Paling sering terjadi pada anak usia 6 bulan–5 tahun. "
                "Umumnya jinak dan tidak menyebabkan kerusakan otak."
            ),
            "recommendations": [
                "Baringkan anak miring agar tidak tersedak jika muntah",
                "Longgarkan pakaian dan beri ruang udara yang cukup",
                "Kompres hangat (bukan dingin) dan berikan antipiretik (parasetamol/ibuprofen) sesuai dosis",
                "Jangan memasukkan benda apapun ke mulut anak selama kejang",
                "Bawa ke dokter / puskesmas setelah kejang untuk mencari penyebab demam",
                "Konsultasikan kepada dokter tentang penyediaan diazepam rektal di rumah",
            ],
        },
    ],
    1: [
        {
            "name_id": "Kejang Demam Kompleks — Durasi Panjang",
            "name_en": "Complex Febrile Seizure (Prolonged)",
            "conditions": ["fever_before", "loss_of_consciousness", "postictal_drowsy"],
            "threshold": 2,
            "description": (
                "Kejang demam yang berlangsung ≥15 menit, ATAU bersifat fokal (satu sisi tubuh), "
                "ATAU berulang lebih dari sekali dalam 24 jam. Memerlukan evaluasi lebih mendalam "
                "karena risiko epilepsi di kemudian hari lebih tinggi dibanding kejang demam sederhana."
            ),
            "recommendations": [
                "Segera bawa ke IGD jika kejang berlangsung lebih dari 5 menit tanpa berhenti",
                "Pemeriksaan EEG direkomendasikan untuk evaluasi aktivitas otak",
                "MRI otak jika ada defisit neurologis atau kejang fokal",
                "Diskusikan dengan neurolog anak tentang risiko dan rencana tatalaksana jangka panjang",
                "Pastikan tersedia diazepam rektal sebagai pertolongan pertama di rumah",
                "Pantau perkembangan motorik dan kognitif anak secara berkala",
            ],
        },
        {
            "name_id": "Kejang Demam Kompleks — Fokal",
            "name_en": "Complex Febrile Seizure (Focal)",
            "conditions": ["fever_before", "focal_movement", "eye_deviation"],
            "threshold": 2,
            "description": (
                "Varian kejang demam kompleks di mana gerakan kejang hanya melibatkan satu sisi "
                "tubuh atau mata mendelik ke satu arah. Ini menandakan aktivitas epileptik berasal "
                "dari satu area otak tertentu dan memerlukan evaluasi neurologis."
            ),
            "recommendations": [
                "Rekam video episode jika memungkinkan untuk ditunjukkan kepada dokter",
                "EEG dan MRI otak sangat dianjurkan",
                "Konsultasi neurolog anak untuk menentukan apakah perlu obat anti-epilepsi",
                "Cari penyebab demam secara menyeluruh (infeksi virus, bakteri)",
                "Pemantauan tumbuh kembang anak secara rutin",
            ],
        },
        {
            "name_id": "Kejang Demam Kompleks — Berulang",
            "name_en": "Complex Febrile Seizure (Recurrent)",
            "conditions": ["fever_before", "recurrence_same_day", "prior_seizure"],
            "threshold": 2,
            "description": (
                "Kejang demam yang terjadi lebih dari sekali dalam periode 24 jam yang sama. "
                "Kondisi ini memerlukan observasi lebih ketat dan evaluasi penyebab demam "
                "yang lebih dalam, termasuk kemungkinan meningitis atau ensefalitis."
            ),
            "recommendations": [
                "Rawat inap untuk observasi dan investigasi penyebab demam",
                "Pemeriksaan darah lengkap, elektrolit, dan jika perlu pungsi lumbal",
                "EEG setelah kondisi stabil",
                "Diskusi dengan neurolog anak mengenai profilaksis kejang",
                "Edukasi orang tua tentang tanda bahaya dan cara penanganan di rumah",
            ],
        },
    ],
    2: [
        {
            "name_id": "Kejang Epileptik Fokal",
            "name_en": "Focal Epileptic Seizure",
            "conditions": ["focal_movement", "eye_deviation", "sudden_onset"],
            "threshold": 2,
            "description": (
                "Kejang yang terjadi tanpa demam dan menunjukkan pola fokal — gerakan atau gejala "
                "hanya pada satu sisi tubuh. Sering kali merupakan manifestasi epilepsi yang "
                "berasal dari area korteks otak tertentu. Perlu investigasi penyebab struktural."
            ),
            "recommendations": [
                "Konsultasi segera ke neurolog anak",
                "EEG lengkap termasuk pemeriksaan saat tidur",
                "MRI otak protokol epilepsi untuk mencari kelainan struktural",
                "Mulai catatan harian kejang (tanggal, waktu, durasi, pola)",
                "Diskusikan pemberian obat anti-epilepsi dengan dokter spesialis",
            ],
        },
        {
            "name_id": "Kejang Epileptik Umum Tanpa Demam",
            "name_en": "Generalized Epileptic Seizure (Afebrile)",
            "conditions": ["loss_of_consciousness", "sudden_onset", "prior_seizure"],
            "threshold": 2,
            "description": (
                "Kejang yang melibatkan seluruh tubuh tanpa didahului demam. Hilangnya kesadaran "
                "terjadi mendadak dan dapat disertai kekakuan atau sentakan. Kondisi ini "
                "memerlukan evaluasi epilepsi secara komprehensif."
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
            "name_id": "Kejang Tanpa Demam dengan Riwayat Epilepsi",
            "name_en": "Afebrile Seizure with Epilepsy History",
            "conditions": ["prior_seizure", "family_history", "developmental_delay"],
            "threshold": 2,
            "description": (
                "Kejang berulang tanpa demam pada anak yang memiliki riwayat kejang sebelumnya "
                "atau riwayat keluarga dengan epilepsi. Kemungkinan besar merupakan epilepsi "
                "yang memerlukan terapi jangka panjang."
            ),
            "recommendations": [
                "Evaluasi efektivitas dan kepatuhan terapi anti-epilepsi jika sudah ada",
                "EEG ulang untuk memantau pola aktivitas otak",
                "Tinjau kembali dosis obat bersama neurolog anak",
                "Hindari faktor pencetus: kurang tidur, cahaya berkedip, stres",
                "Dukungan psikologis untuk anak dan keluarga",
                "Pertimbangkan konseling genetik jika ada riwayat keluarga kuat",
            ],
        },
    ],
}


def get_diagnosis(label: int, row: dict) -> dict:
    """Pilih diagnosis spesifik berdasarkan kondisi yang terpenuhi."""
    candidates = DIAGNOSES[label]
    best, best_score = None, -1
    for dx in candidates:
        score = sum(1 for c in dx["conditions"] if row.get(c, 0) == 1)
        if score >= dx["threshold"] and score > best_score:
            best_score = score
            best = dx
    return best if best else candidates[0]


# ── Training ───────────────────────────────────────────────────────────────────

def train():
    os.makedirs("data",  exist_ok=True)
    os.makedirs("model", exist_ok=True)

    csv_path = "data/seizure_dataset.csv"
    if not os.path.exists(csv_path):
        print("Dataset tidak ditemukan. Generate otomatis...")
        from generate_dataset import generate_samples
        df = generate_samples()
        df.to_csv(csv_path, index=False)
    else:
        df = pd.read_csv(csv_path)

    print(f"Dataset dimuat: {len(df)} baris")
    print(df["label"].value_counts().sort_index())

    X = df[FEATURES]
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Preprocessing: scale numerik, biarkan biner apa adanya
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("bin", FunctionTransformer(), BINARY_FEATURES),
        ]
    )

    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    gbm = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        max_features="sqrt",
        random_state=42,
    )

    voting = VotingClassifier(
        estimators=[("rf", rf), ("gbm", gbm)],
        voting="soft",
        weights=[1, 1],
    )

    pipeline = Pipeline([
        ("prep", preprocessor),
        ("clf",  voting),
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)

    acc  = accuracy_score(y_test, y_pred)
    f1   = f1_score(y_test, y_pred, average="weighted")
    prec = precision_score(y_test, y_pred, average="weighted")
    rec  = recall_score(y_test, y_pred, average="weighted")

    print(f"\nAccuracy : {acc:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=list(LABEL_NAMES.values())))

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="accuracy")
    print(f"CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Feature importance dari RF
    rf_fitted = pipeline.named_steps["clf"].named_estimators_["rf"]
    importances = rf_fitted.feature_importances_
    # Urutan fitur setelah ColumnTransformer: numeric dulu, lalu binary
    ordered_features = NUMERIC_FEATURES + BINARY_FEATURES
    feat_imp = dict(sorted(
        zip(ordered_features, importances),
        key=lambda x: x[1], reverse=True
    ))

    with open("model/seizure_model.pkl", "wb") as f:
        pickle.dump(pipeline, f)

    cm = confusion_matrix(y_test, y_pred).tolist()
    metadata = {
        "features":           FEATURES,
        "numeric_features":   NUMERIC_FEATURES,
        "binary_features":    BINARY_FEATURES,
        "label_names":        {str(k): v for k, v in LABEL_NAMES.items()},
        "label_en":           {str(k): v for k, v in LABEL_EN.items()},
        "metrics": {
            "accuracy":          round(acc,  4),
            "f1_score":          round(f1,   4),
            "precision":         round(prec, 4),
            "recall":            round(rec,  4),
            "cv_accuracy_mean":  round(float(cv_scores.mean()), 4),
            "cv_accuracy_std":   round(float(cv_scores.std()),  4),
        },
        "confusion_matrix":   cm,
        "class_report":       classification_report(
            y_test, y_pred,
            target_names=list(LABEL_NAMES.values()),
            output_dict=True,
        ),
        "feature_importances": {k: round(float(v), 6) for k, v in feat_imp.items()},
    }

    with open("model/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print("\nModel disimpan → model/seizure_model.pkl")
    print("Metadata disimpan → model/metadata.json")
    return pipeline, metadata


if __name__ == "__main__":
    train()
