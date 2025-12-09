# Retail SupplyChainIQ

This repository contains a FastAPI backend and Streamlit dashboard for the Retail SupplyChainIQ demo. The commands below show how to run both services in **PowerShell** from the project root on Windows.

## Prerequisites
- Python 3.10+
- PowerShell 7+ recommended (for `curl` compatibility)
- Optional: [uvicorn](https://www.uvicorn.org/) and [Streamlit](https://streamlit.io/) are installed via `requirements.txt`

## Setup (PowerShell)
```powershell
# Clone or download the repo, then from the project root:
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

## Run the backend (FastAPI)
```powershell
# From the project root
echo "Starting FastAPI backend on http://localhost:8000"
uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000
```

- The `/health` endpoint should return `{ "status": "ok" }`:
```powershell
# In a second PowerShell window after the server starts
curl http://localhost:8000/health
```

## Run the frontend (Streamlit)
```powershell
# In a new PowerShell window, with the virtual environment still activated
streamlit run frontend/app.py --server.port 8501
```

- Streamlit will print a local URL (e.g., `http://localhost:8501`). Open it in a browser.

## Generate demo data
Once both services are running:
1. Open the Streamlit UI.
2. In the left sidebar, click **"Generate Synthetic Data (5000 rows x 4 tables)"** to seed the backend with demo datasets.
3. Use the analytics tabs to explore inventory, demand, supplier, shipments, and forecasting views.

If you prefer the API directly, you can also trigger data generation from PowerShell:
```powershell
curl -Method POST http://localhost:8000/data/generate
```

## Troubleshooting
- Ensure both windows have the virtual environment activated before running `uvicorn` or `streamlit`.
- If ports 8000 or 8501 are in use, update the `--port` flags and the `API_BASE` URL in `frontend/app.py` accordingly.
