"""
generate_dataset.py
===================
Membuat dataset sintetik klinis untuk klasifikasi kondisi kejang pada anak.

Tiga label output:
  0 = Kejang Demam Sederhana  (Simple Febrile Seizure)
  1 = Kejang Demam Kompleks   (Complex Febrile Seizure)
  2 = Kejang Tanpa Demam      (Afebrile / Non-febrile Seizure)

Fitur input (campuran numerik + biner):
  - age_months        : usia anak dalam bulan (6–120)
  - temperature       : suhu tubuh saat kejang (°C)
  - fever_before      : 1 = didahului demam sebelum kejang
  - fever_duration_h  : lama demam sebelum kejang (jam, 0 jika tidak ada)
  - duration_minutes  : lama kejang berlangsung (menit)
  - focal_movement    : 1 = gerakan hanya satu sisi tubuh
  - recurrence_same_day : 1 = kejang berulang dalam 24 jam yang sama
  - postictal_drowsy  : 1 = sangat mengantuk / lemas setelah kejang
  - eye_deviation     : 1 = mata mendelik ke satu arah
  - loss_of_consciousness : 1 = hilang kesadaran saat kejang
  - cyanosis          : 1 = bibir/kulit kebiruan
  - family_history    : 1 = ada keluarga dengan riwayat kejang/epilepsi
  - prior_seizure     : 1 = pernah kejang sebelumnya
  - developmental_delay : 1 = ada keterlambatan tumbuh kembang
  - sudden_onset      : 1 = kejang terjadi mendadak tanpa tanda awal
"""

import os
import numpy as np
import pandas as pd

np.random.seed(42)

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

LABEL_NAMES = {
    0: "Kejang Demam Sederhana",
    1: "Kejang Demam Kompleks",
    2: "Kejang Tanpa Demam",
}


def _clamp(val, lo, hi):
    return max(lo, min(hi, val))


def generate_samples(
    n_simple=500,
    n_complex=350,
    n_afebrile=350,
):
    rows = []

    # ── KEJANG DEMAM SEDERHANA ───────────────────────────────────────────────
    # Profil klinis:
    #   • Usia 6–60 bulan (puncak 12–36 bln)
    #   • Suhu tinggi (38.5–41°C)
    #   • Selalu didahului demam
    #   • Durasi <15 menit, tidak fokal, tidak berulang hari yang sama
    for _ in range(n_simple):
        age  = int(np.random.normal(24, 12))
        age  = _clamp(age, 6, 60)
        temp = round(np.random.normal(39.2, 0.5), 1)
        temp = _clamp(temp, 38.5, 41.0)
        fever_dur = round(np.random.uniform(1, 24), 1)
        dur  = round(np.random.normal(3.5, 2.0), 1)
        dur  = _clamp(dur, 0.5, 14.9)

        row = {
            "age_months":            age,
            "temperature":           temp,
            "fever_before":          1,
            "fever_duration_h":      fever_dur,
            "duration_minutes":      dur,
            "focal_movement":        int(np.random.rand() < 0.04),
            "recurrence_same_day":   int(np.random.rand() < 0.03),
            "postictal_drowsy":      int(np.random.rand() < 0.30),
            "eye_deviation":         int(np.random.rand() < 0.08),
            "loss_of_consciousness": int(np.random.rand() < 0.70),
            "cyanosis":              int(np.random.rand() < 0.15),
            "family_history":        int(np.random.rand() < 0.30),
            "prior_seizure":         int(np.random.rand() < 0.20),
            "developmental_delay":   int(np.random.rand() < 0.05),
            "sudden_onset":          int(np.random.rand() < 0.20),
            "label": 0,
        }
        rows.append(row)

    # ── KEJANG DEMAM KOMPLEKS ────────────────────────────────────────────────
    # Profil klinis:
    #   • Usia lebih bervariasi (6–72 bln)
    #   • Suhu tidak harus sangat tinggi (38–40.5°C)
    #   • Didahului demam (bisa singkat)
    #   • Durasi ≥15 menit ATAU fokal ATAU berulang hari sama
    for _ in range(n_complex):
        age  = int(np.random.normal(30, 15))
        age  = _clamp(age, 6, 72)
        temp = round(np.random.normal(38.8, 0.6), 1)
        temp = _clamp(temp, 38.0, 40.5)
        fever_dur = round(np.random.uniform(0.5, 12), 1)

        # Salah satu atau lebih ciri kompleks harus ada
        focal   = int(np.random.rand() < 0.50)
        recur   = int(np.random.rand() < 0.45)
        dur_long = np.random.rand() < 0.55
        dur = round(np.random.normal(22, 10), 1) if dur_long else round(np.random.normal(10, 4), 1)
        dur = _clamp(dur, 1.0, 60.0)

        row = {
            "age_months":            age,
            "temperature":           temp,
            "fever_before":          1,
            "fever_duration_h":      fever_dur,
            "duration_minutes":      dur,
            "focal_movement":        focal,
            "recurrence_same_day":   recur,
            "postictal_drowsy":      int(np.random.rand() < 0.65),
            "eye_deviation":         int(np.random.rand() < 0.40),
            "loss_of_consciousness": int(np.random.rand() < 0.85),
            "cyanosis":              int(np.random.rand() < 0.40),
            "family_history":        int(np.random.rand() < 0.35),
            "prior_seizure":         int(np.random.rand() < 0.40),
            "developmental_delay":   int(np.random.rand() < 0.20),
            "sudden_onset":          int(np.random.rand() < 0.30),
            "label": 1,
        }
        rows.append(row)

    # ── KEJANG TANPA DEMAM ───────────────────────────────────────────────────
    # Profil klinis:
    #   • Usia lebih luas (3–120 bln)
    #   • Suhu normal (36–37.9°C)
    #   • Tidak didahului demam
    #   • Bisa fokal atau umum, mungkin ada riwayat epilepsi keluarga
    for _ in range(n_afebrile):
        age  = int(np.random.normal(48, 28))
        age  = _clamp(age, 3, 120)
        temp = round(np.random.normal(36.8, 0.3), 1)
        temp = _clamp(temp, 36.0, 37.9)

        dur = round(np.random.exponential(5), 1)
        dur = _clamp(dur, 0.5, 45.0)

        row = {
            "age_months":            age,
            "temperature":           temp,
            "fever_before":          0,
            "fever_duration_h":      0.0,
            "duration_minutes":      dur,
            "focal_movement":        int(np.random.rand() < 0.45),
            "recurrence_same_day":   int(np.random.rand() < 0.25),
            "postictal_drowsy":      int(np.random.rand() < 0.55),
            "eye_deviation":         int(np.random.rand() < 0.35),
            "loss_of_consciousness": int(np.random.rand() < 0.75),
            "cyanosis":              int(np.random.rand() < 0.30),
            "family_history":        int(np.random.rand() < 0.40),
            "prior_seizure":         int(np.random.rand() < 0.50),
            "developmental_delay":   int(np.random.rand() < 0.30),
            "sudden_onset":          int(np.random.rand() < 0.70),
            "label": 2,
        }
        rows.append(row)

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    return df


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    df = generate_samples()
    df.to_csv("data/seizure_dataset.csv", index=False)
    print(f"Dataset berhasil dibuat: {len(df)} baris")
    print(df["label"].value_counts().sort_index())
    print("\nContoh data:")
    print(df.head(3).to_string())
