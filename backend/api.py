from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from .data_generator import save_synthetic_data
from .analytics import (
    load_inventory,
    load_demand,
    load_suppliers,
    load_shipments,
    analytics_summary,
    stockout_risk,
    excess_inventory,
    shrinkage_summary,
    promo_lift,
    detect_anomalies,
    forecast_item,
    supplier_risk,
    shipment_delay_summary,
)
from .rag_engine import rag_engine
from .models import AnalyticsSummaryResponse, RAGQueryRequest, RAGQueryResponse


app = FastAPI(title="Retail SupplyChainIQ API", version="1.0")

# CORS so frontend (Streamlit or React) can talk to this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================================================
# HEALTH
# ======================================================
@app.get("/health")
def health():
    return {"status": "ok"}


# ======================================================
# DATA GENERATION
# ======================================================
@app.post("/data/generate")
def generate_data():
    """
    Generates all 4 synthetic tables (5000 rows each):
    - inventory.csv
    - demand_history.csv
    - supplier.csv
    - shipments.csv
    """
    paths = save_synthetic_data()
    return {"message": "Synthetic data generated.", "paths": paths}


# ======================================================
# SUMMARY ENDPOINTS
# ======================================================

@app.get("/analytics/inventory-summary", response_model=AnalyticsSummaryResponse)
def inventory_summary():
    df = load_inventory()
    summary = analytics_summary(df)
    return AnalyticsSummaryResponse(**summary)


@app.get("/analytics/demand-summary", response_model=AnalyticsSummaryResponse)
def demand_summary():
    df = load_demand()
    summary = analytics_summary(df)
    return AnalyticsSummaryResponse(**summary)


@app.get("/analytics/supplier-summary", response_model=AnalyticsSummaryResponse)
def supplier_summary():
    df = load_suppliers()
    summary = analytics_summary(df)
    return AnalyticsSummaryResponse(**summary)


@app.get("/analytics/shipments-summary", response_model=AnalyticsSummaryResponse)
def shipments_summary():
    df = load_shipments()
    summary = analytics_summary(df)
    return AnalyticsSummaryResponse(**summary)


# ======================================================
# INVENTORY / DEMAND ANALYTICS
# ======================================================

@app.get("/analytics/stockout-risk")
def get_stockout_risk(top_n: int = 20):
    inv = load_inventory()
    demand = load_demand()
    df = stockout_risk(inv, demand).head(top_n)
    return df.to_dict(orient="records")


@app.get("/analytics/excess-inventory")
def get_excess_inventory(top_n: int = 20):
    inv = load_inventory()
    demand = load_demand()
    df = excess_inventory(inv, demand).head(top_n)
    return df.to_dict(orient="records")


@app.get("/analytics/shrinkage")
def get_shrinkage(top_n: int = 20):
    demand = load_demand()
    df = shrinkage_summary(demand).head(top_n)
    return df.to_dict(orient="records")


@app.get("/analytics/promo-lift")
def get_promo_lift(top_n: int = 20):
    demand = load_demand()
    df = promo_lift(demand).head(top_n)
    return df.to_dict(orient="records")


@app.get("/analytics/anomalies")
def get_anomalies():
    demand = load_demand()
    df = detect_anomalies(demand)
    return df.to_dict(orient="records")


@app.get("/analytics/forecast")
def get_forecast(item_id: int, periods: int = 7):
    demand = load_demand()
    try:
        df = forecast_item(demand, item_id, periods)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return df.to_dict(orient="records")


# ======================================================
# SUPPLIER / SHIPMENT ANALYTICS
# ======================================================

@app.get("/analytics/supplier-risk")
def get_supplier_risk(top_n: int = 20):
    suppliers = load_suppliers()
    df = supplier_risk(suppliers).head(top_n)
    return df.to_dict(orient="records")


@app.get("/analytics/shipment-delays")
def get_shipment_delays(top_n: int = 50):
    shipments = load_shipments()
    df = shipment_delay_summary(shipments).head(top_n)
    return df.to_dict(orient="records")


# ======================================================
# RAG: AI SUPPLY CHAIN ANALYST
# ======================================================

@app.post("/rag/query", response_model=RAGQueryResponse)
def rag_query(req: RAGQueryRequest):
    answer, context = rag_engine.query(req.query)
    return RAGQueryResponse(answer=answer, retrieved_context=context)



@app.get("/debug/env")
def debug_env():
    import os
    return {"OPENAI_API_KEY": os.getenv("OPENAI_API_KEY")}
