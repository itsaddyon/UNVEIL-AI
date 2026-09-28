# UNVEIL AI
Unified Network for Veiled-actor Evidence & Identity Linking
SIH26151 — Dark Web Threat Actor De-anonymization (NTRO)

## Overview
**UNVEIL AI** is an investigator-facing intelligence platform built to transform fragmented, synthetic dark-web intelligence (aliases, PGP keys, wallets, posts, infrastructure) into an explainable, evidence-backed map of probable threat-actor identities.

This platform emphasizes **Graph-first investigation**, transparent **Noisy-OR probabilistic fusion** for attribution, and clear **evidence traceability**.

## Key Features
- **Investigation Canvas:** Interactive graph-based workspace for connecting aliases, crypto wallets, and infrastructure.
- **Persona DNA Analysis:** Stylometric and behavioral analysis engine to link multiple dark web personas to a single threat actor.
- **Attribution Engine:** Uses a Noisy-OR probabilistic fusion model, ensuring deterministic and explainable attribution scoring.
- **LLM Narrator (Optional):** Generates human-readable explanations of computed attribution scores and evidence, powered by a pluggable LLM architecture.
- **Synthetic Data Generation:** Includes `seed.py` to generate functional, realistic datasets for testing and demonstration without the need for active web crawling.

## System Architecture & Tech Stack

### Frontend
- **Framework:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Core Components:** Investigation Canvas, Inspector Panel, Persona DNA Strip, Timeline Strip

### Backend
- **Framework:** Python, FastAPI, Uvicorn
- **Database:** SQLite (via SQLAlchemy)
- **Engines:** Orchestrator (State Machine), Stylometry Engine, Infrastructure Analysis, Attribution Engine

## Getting Started

### 1. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
```
Install the requirements (assuming a virtual environment is activated):
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```
Run the FastAPI development server:
```bash
uvicorn app.main:app --reload
```
*(Note: To generate synthetic data, run `python app/seed.py` before starting the server.)*

### 2. Frontend Setup
Navigate to the `frontend/` directory:
```bash
cd frontend
```
Install dependencies and run the Vite server:
```bash
npm install
npm run dev
```

## Documentation
- `docs/PHASE0_BLUEPRINT.md`: Comprehensive product, architecture, data, and UX blueprint.
- `docs/LLM_PROVIDER_STRATEGY.md`: Strategy for pluggable LLM integrations.
