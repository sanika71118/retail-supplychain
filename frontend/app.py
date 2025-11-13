import streamlit as st
import requests
import altair as alt
import pandas as pd

API_BASE = "http://localhost:8000"

st.set_page_config(
    page_title="Retail SupplyChainIQ",
    layout="wide",
)

st.title("Retail SupplyChainIQ")
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

    # ---------------------------
    # INVENTORY VISUALS
    # ---------------------------
    st.subheader("Inventory Charts")

    df_inv = pd.read_csv("data/synthetic/inventory.csv")

    st.markdown("### Stock by Category")
    stock_by_cat = df_inv.groupby("category")["stock"].sum().reset_index()
    st.bar_chart(stock_by_cat.set_index("category"))

    st.markdown("### Excess Inventory (Top 20)")
    df_excess = pd.DataFrame(requests.get(f"{API_BASE}/analytics/excess-inventory").json())
    if not df_excess.empty:
        st.bar_chart(df_excess.set_index("item_id")["excess_units"])


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
        df = pd.DataFrame(requests.get(f"{API_BASE}/analytics/promo-lift").json())
        st.dataframe(df)
    except:
        st.info("Generate data first.")

    st.subheader("Shrinkage Summary (Top 20)")
    try:
        df = pd.DataFrame(requests.get(f"{API_BASE}/analytics/shrinkage").json())
        st.dataframe(df)
    except:
        st.info("Unavailable.")

    st.subheader("Demand Anomalies")
    try:
        df = pd.DataFrame(requests.get(f"{API_BASE}/analytics/anomalies").json())
        st.dataframe(df)
    except:
        st.info("Unavailable.")

    # ---------------------------
    # DEMAND VISUALS
    # ---------------------------
    st.subheader("Demand Charts")

    df_demand = pd.read_csv("data/synthetic/demand_history.csv", parse_dates=["date"])

    st.markdown("### Daily Demand Trend")
    daily = df_demand.groupby("date")["units_sold"].sum().reset_index()
    st.line_chart(daily.set_index("date"))

    st.markdown("### Promo vs Non-Promo Demand")
    promo_compare = df_demand.groupby("promo_flag")["units_sold"].mean().reset_index()
    promo_compare["promo_flag"] = promo_compare["promo_flag"].map({0: "No Promo", 1: "Promo"})
    st.bar_chart(promo_compare.set_index("promo_flag"))

    st.markdown("### Sales by Channel")
    channel_split = df_demand.groupby("channel")["units_sold"].sum()
    st.bar_chart(channel_split)



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

    # ---------------------------
    # SUPPLIER VISUALS
    # ---------------------------
    st.subheader("Supplier Charts")

    df_suppliers = pd.read_csv("data/synthetic/supplier.csv")

    # On-time rate distribution
    st.markdown("### On-time Delivery Rate Distribution")
    hist_on_time = alt.Chart(df_suppliers).mark_bar().encode(
    x=alt.X("on_time_rate:Q", bin=True, title="On-time Delivery Rate"),
    y=alt.Y("count()", title="Count")
    ).properties(width=700, height=300)

    st.altair_chart(hist_on_time, use_container_width=True)


    # Defect rate distribution
    st.markdown("### Defect Rate Distribution")
    hist_defect = alt.Chart(df_suppliers).mark_bar().encode(
    x=alt.X("defect_rate:Q", bin=True, title="Defect Rate"),
    y=alt.Y("count()", title="Count")
    ).properties(width=700, height=300)

    st.altair_chart(hist_defect, use_container_width=True)


    # Risk Score Top 20
    st.markdown("### Supplier Risk Score (Top 20)")
    top_risk = pd.DataFrame(requests.get(f"{API_BASE}/analytics/supplier-risk").json())
    if not top_risk.empty:
        st.bar_chart(top_risk.set_index("supplier_id")["risk_score"])



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

    # ---------------------------
    # SHIPMENT VISUALS
    # ---------------------------
    st.subheader("Shipment Charts")

    df_ship = pd.read_csv("data/synthetic/shipments.csv", parse_dates=["date_shipped","date_received"])
    df_ship["transit_days"] = (df_ship["date_received"] - df_ship["date_shipped"]).dt.days

    # Transit time distribution
    st.markdown("### Transit Time Distribution")
    hist_transit = alt.Chart(df_ship).mark_bar().encode(
        x=alt.X("transit_days:Q", bin=True, title="Transit Days"),
        y=alt.Y("count()", title="Count")
    ).properties(width=700, height=300)

    st.altair_chart(hist_transit, use_container_width=True)

    # Shipment Volume by Supplier (Top 20)
    st.markdown("### Shipment Volume by Supplier (Top 20)")
    vol = df_ship.groupby("supplier_id")["qty"].sum().nlargest(20)
    st.bar_chart(vol)

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
                df_forecast = pd.DataFrame(resp.json())

                # Load historical demand
                df_hist = pd.read_csv("data/synthetic/demand_history.csv", parse_dates=["date"])
                df_hist_item = df_hist[df_hist["item_id"] == item_id]

                hist_daily = (
                    df_hist_item.groupby("date")["units_sold"].sum().reset_index()
                )

                df_forecast["type"] = "Forecast"
                hist_daily["type"] = "Actual"

                combined = pd.concat([
                    hist_daily[["date","units_sold","type"]],
                    df_forecast.rename(columns={"forecast_units":"units_sold"})
                ])

                st.markdown("### Actual vs Forecast Demand")
                st.line_chart(combined.set_index("date")["units_sold"])

                st.markdown("### Forecast Table")
                st.dataframe(df_forecast)

                st.markdown("### Smoothed Forecast Trend")
                df_forecast["smoothed"] = df_forecast["units_sold"].rolling(3).mean()
                st.line_chart(df_forecast.set_index("date")[["smoothed"]])

            else:
                st.error(resp.text)

        except Exception as e:
            st.error(f"Failed to fetch forecast: {e}")



# ------------------------------------------------------
# AI SUPPLY CHAIN ASSISTANT
# ------------------------------------------------------
with tab_ai:
    st.subheader("Ask the AI Supply Chain Analyst")
    query = st.text_input("Enter your business question:")

    if query:
        resp = requests.post(f"{API_BASE}/rag/query", json={"query": query})
        if resp.status_code == 200:
            data = resp.json()
            st.markdown("### Answer")
            st.write(data["answer"])


        else:
            st.error(resp.text)
