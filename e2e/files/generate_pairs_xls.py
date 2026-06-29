#!/usr/bin/env python3
"""
Generates e2e/files/pairs_valid.xls — a minimal valid XLS file in the FFT format
expected by the jap-assistant backend (onglet "Inscriptions").

Usage:
    pip install xlwt
    python e2e/files/generate_pairs_xls.py

Or from the backend virtualenv (xlwt is likely already installed):
    cd /path/to/jap-assistant-backend
    source .venv/bin/activate
    python /path/to/jap-assistant-web/e2e/files/generate_pairs_xls.py
"""

import sys
import os

try:
    import xlwt
except ImportError:
    print("xlwt not installed. Run: pip install xlwt")
    sys.exit(1)

COLUMNS = [
    "Epreuve", "Catégorie d'âge", "Rang",
    "Nom J1", "Prénom J1", "Naissance J1", "Licence J1", "Club J1", "Classement J1", "Courriel J1", "Portable J1",
    "Nom J2", "Prénom J2", "Naissance J2", "Licence J2", "Club J2", "Classement J2", "Courriel J2", "Portable J2",
    "Poids paire",
]

PAIRS = [
    {
        "Epreuve": "P100 Homme",
        "Catégorie d'âge": "Senior",
        "Rang": 1,
        "Nom J1": "Dupont", "Prénom J1": "Alice", "Naissance J1": "01/01/1990",
        "Licence J1": "1234567A", "Club J1": "Club Test", "Classement J1": 200,
        "Courriel J1": "alice@example.com", "Portable J1": "0600000001",
        "Nom J2": "Martin", "Prénom J2": "Beatrice", "Naissance J2": "01/01/1992",
        "Licence J2": "2345678B", "Club J2": "Club Test", "Classement J2": 150,
        "Courriel J2": "beatrice@example.com", "Portable J2": "0600000002",
        "Poids paire": 350,
    },
    {
        "Epreuve": "P100 Homme",
        "Catégorie d'âge": "Senior",
        "Rang": 2,
        "Nom J1": "Leroy", "Prénom J1": "Claire", "Naissance J1": "15/03/1988",
        "Licence J1": "3456789C", "Club J1": "Club E2E", "Classement J1": 180,
        "Courriel J1": "claire@example.com", "Portable J1": "0600000003",
        "Nom J2": "Bernard", "Prénom J2": "Diana", "Naissance J2": "22/07/1995",
        "Licence J2": "4567890D", "Club J2": "Club E2E", "Classement J2": 160,
        "Courriel J2": "diana@example.com", "Portable J2": "0600000004",
        "Poids paire": 340,
    },
    {
        "Epreuve": "P100 Homme",
        "Catégorie d'âge": "Senior",
        "Rang": 3,
        "Nom J1": "Moreau", "Prénom J1": "Emma", "Naissance J1": "10/11/1991",
        "Licence J1": "5678901E", "Club J1": "Tennis Club", "Classement J1": 170,
        "Courriel J1": "emma@example.com", "Portable J1": "0600000005",
        "Nom J2": "Simon", "Prénom J2": "Fanny", "Naissance J2": "05/04/1993",
        "Licence J2": "6789012F", "Club J2": "Tennis Club", "Classement J2": 140,
        "Courriel J2": "fanny@example.com", "Portable J2": "0600000006",
        "Poids paire": 310,
    },
]

output_path = os.path.join(os.path.dirname(__file__), "pairs_valid.xls")

wb = xlwt.Workbook(encoding="utf-8")
ws = wb.add_sheet("Inscriptions")

# Write header
for col_idx, col_name in enumerate(COLUMNS):
    ws.write(0, col_idx, col_name)

# Write data rows
for row_idx, pair in enumerate(PAIRS, start=1):
    for col_idx, col_name in enumerate(COLUMNS):
        ws.write(row_idx, col_idx, pair.get(col_name, ""))

wb.save(output_path)
print(f"Generated: {output_path}")
