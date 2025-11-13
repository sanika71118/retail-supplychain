import streamlit as st
import requests
import pandas as pd

API_BASE = "http://localhost:8000"

st.set_page_config(
    page_title="Retail SupplyChainIQ",
    layout="wide",
)

st.title("Retail SupplyChainIQ 🏬📦")
st.caption("AI-powered retail supply chain analytics and forecasting platform.")


# ======================================================
# SIDEBAR
# ======================================================
with st.sidebar:
    st.header("System Controls")

    if st.button("Generate Synthetic Data (5000 rows x 4 tables)"):
        with st.spinner("Generating synthetic retail data..."):
            resp = requests.post(f"{API_BASE}/data/generate")
            if resp.status_code == 200:
                st.success("Synthetic data generated successfully.")
            else:
                st.error(resp.text)

    st.divider()
    st.subheader("Backend Status")
    try:
        resp = requests.get(f"{API_BASE}/health")
        st.success("Backend connected ✓")
    except Exception:
        st.error("Backend not reachable. Start FastAPI.")
    


# ======================================================
# MAIN TABS
# ======================================================
tab_inventory, tab_demand, tab_suppliers, tab_shipments, tab_forecast, tab_ai = st.tabs([
    "Inventory Summary",
    "Demand & Sales Analysis",
    "Supplier Analytics",
    "Shipments & Lead Times",
    "Forecasting",
    "AI Supply Chain Assistant"
])

# ------------------------------------------------------
# INVENTORY SUMMARY
# ------------------------------------------------------
with tab_inventory:
    st.subheader("Inventory Summary")
    try:
        resp = requests.get(f"{API_BASE}/analytics/inventory-summary")
        if resp.status_code == 200:
            summary = resp.json()
            st.json(summary["summary"])
            st.info(f"Rows: {summary['shape'][0]}, Columns: {summary['shape'][1]}")
        else:
            st.error(resp.text)
    except:
        st.info("Generate data first.")

    st.subheader("Stockout Risk (Top 20)")
    try:
        data = requests.get(f"{API_BASE}/analytics/stockout-risk").json()
        df = pd.DataFrame(data)
        st.dataframe(df)
    except:
        st.info("No data available.")

    st.subheader("Excess Inventory (Top 20)")
    try:
        data = requests.get(f"{API_BASE}/analytics/excess-inventory").json()
        df = pd.DataFrame(data)
        st.dataframe(df)
    except:
        st.info("No data available.")



# ------------------------------------------------------
# DEMAND ANALYSIS
# ------------------------------------------------------
with tab_demand:
    st.subheader("Demand Summary")
    try:
        resp = requests.get(f"{API_BASE}/analytics/demand-summary")
        st.json(resp.json()["summary"])
    except:
        st.info("No data available.")

    st.subheader("Promo Lift (Top 20)")
    try:
        data = requests.get(f"{API_BASE}/analytics/promo-lift").json()
        df = pd.DataFrame(data)
        st.dataframe(df)
    except:
        st.info("Generate data first.")

    st.subheader("Shrinkage Summary (Top 20)")
    try:
        data = requests.get(f"{API_BASE}/analytics/shrinkage").json()
        df = pd.DataFrame(data)
        st.dataframe(df)
    except:
        st.info("Unavailable.")

    st.subheader("Demand Anomalies")
    try:
        data = requests.get(f"{API_BASE}/analytics/anomalies").json()
        df = pd.DataFrame(data)
        st.dataframe(df)
    except:
        st.info("Unavailable.")


# ------------------------------------------------------
# SUPPLIER ANALYTICS
# ------------------------------------------------------
with tab_suppliers:
    st.subheader("Supplier Summary")
    try:
        resp = requests.get(f"{API_BASE}/analytics/supplier-summary")
        st.json(resp.json()["summary"])
    except:
        st.info("No supplier data.")

    st.subheader("Supplier Risk (Top 20)")
    try:
        data = requests.get(f"{API_BASE}/analytics/supplier-risk").json()
        df = pd.DataFrame(data)
        st.dataframe(df)
    except:
        st.info("Unavailable.")



# ------------------------------------------------------
# SHIPMENT / LEAD TIME ANALYTICS
# ------------------------------------------------------
with tab_shipments:
    st.subheader("Shipment Summary")
    try:
        resp = requests.get(f"{API_BASE}/analytics/shipments-summary")
        st.json(resp.json()["summary"])
    except:
        st.info("No data.")

    st.subheader("Longest Transit Times (Top 50)")
    try:
        data = requests.get(f"{API_BASE}/analytics/shipment-delays").json()
        df = pd.DataFrame(data)
        st.dataframe(df)
    except:
        st.info("Unavailable.")



# ------------------------------------------------------
# FORECASTING
# ------------------------------------------------------
with tab_forecast:
    st.subheader("Item Demand Forecast")

    item_id = st.number_input("Item ID", min_value=1, value=1)
    periods = st.slider("Forecast horizon (days)", min_value=3, max_value=30, value=7)

    if st.button("Run Forecast"):
        try:
            resp = requests.get(
                f"{API_BASE}/analytics/forecast",
                params={"item_id": item_id, "periods": periods},
            )
            if resp.status_code == 200:
                df = pd.DataFrame(resp.json())
                st.line_chart(df.set_index("date")["forecast_units"])
                st.dataframe(df)
            else:
                st.error(resp.text)
        except:
            st.error("Failed to fetch forecast.")



# ------------------------------------------------------
# AI SUPPLY CHAIN ASSISTANT
# ------------------------------------------------------
with tab_ai:
    st.subheader("Ask the AI Supply Chain Analyst")
    query = st.text_input("Enter your business question:")
    show_context = st.checkbox("Show RAG context", value=False)

    if query:
        resp = requests.post(f"{API_BASE}/rag/query", json={"query": query})
        if resp.status_code == 200:
            data = resp.json()
            st.markdown("### Answer")
            st.write(data["answer"])

            if show_context:
                st.markdown("### Retrieved Context")
                st.code(data["retrieved_context"])
        else:
            st.error(resp.text)
