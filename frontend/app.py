import streamlit as st
import requests
import altair as alt
import pandas as pd

API_BASE = "http://localhost:8000"

st.set_page_config(
    page_title="Retail SupplyChainIQ",
    layout="wide",
)

st.markdown(
    """
    <style>
    .card {
        padding: 1rem 1.25rem;
        border-radius: 12px;
        border: 1px solid #e8ecef;
        background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        box-shadow: 0px 4px 10px rgba(0,0,0,0.03);
    }
    .badge-good {
        color: #0f5132;
        background: #d1e7dd;
        border-radius: 999px;
        padding: 0.15rem 0.75rem;
        font-weight: 600;
        font-size: 0.85rem;
    }
    .badge-warn {
        color: #664d03;
        background: #fff3cd;
        border-radius: 999px;
        padding: 0.15rem 0.75rem;
        font-weight: 600;
        font-size: 0.85rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("Retail SupplyChainIQ")
st.caption("AI-powered retail supply chain analytics and forecasting platform.")


# ======================================================
# SIDEBAR
# ======================================================
def status_badge(label: str, variant: str = "good"):
    variant_class = "badge-good" if variant == "good" else "badge-warn"
    return f"<span class='{variant_class}'>{label}</span>"


with st.sidebar:
    st.header("System Controls")
    st.write(
        "Use the controls below to generate demo data and verify the backend connection."
    )

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
        st.markdown(status_badge("Backend connected"), unsafe_allow_html=True)
    except Exception:
        st.markdown(
            status_badge("Backend not reachable. Start FastAPI.", variant="warn"),
            unsafe_allow_html=True,
        )



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
    col_left, col_right = st.columns([2, 1])
    with col_left:
        try:
            resp = requests.get(f"{API_BASE}/analytics/inventory-summary")
            if resp.status_code == 200:
                summary = resp.json()
                st.json(summary["summary"])
            else:
                st.error(resp.text)
        except Exception:
            st.info("Generate data first.")

    with col_right:
        st.markdown("#### Dataset Shape")
        try:
            shape = summary["shape"]
            st.metric("Rows", shape[0])
            st.metric("Columns", shape[1])
        except Exception:
            st.info("Generate data first.")

    st.markdown("### Inventory Watchlist")
    col_stockout, col_excess = st.columns(2)

    with col_stockout:
        st.markdown("#### Stockout Risk (Top 20)")
        try:
            data = requests.get(f"{API_BASE}/analytics/stockout-risk").json()
            st.dataframe(pd.DataFrame(data), use_container_width=True)
        except Exception:
            st.info("No data available.")

    with col_excess:
        st.markdown("#### Excess Inventory (Top 20)")
        try:
            data = requests.get(f"{API_BASE}/analytics/excess-inventory").json()
            st.dataframe(pd.DataFrame(data), use_container_width=True)
        except Exception:
            st.info("No data available.")

    st.divider()
    st.markdown("### Inventory Charts")
    df_inv = pd.read_csv("data/synthetic/inventory.csv")

    chart_cols = st.columns(2)
    with chart_cols[0]:
        st.markdown("#### Stock by Category")
        stock_by_cat = df_inv.groupby("category")["stock"].sum().reset_index()
        st.bar_chart(stock_by_cat.set_index("category"))

    with chart_cols[1]:
        st.markdown("#### Excess Inventory (Top 20)")
        df_excess = pd.DataFrame(
            requests.get(f"{API_BASE}/analytics/excess-inventory").json()
        )
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

    col_promo, col_shrink = st.columns(2)

    with col_promo:
        st.markdown("#### Promo Lift (Top 20)")
        try:
            df = pd.DataFrame(requests.get(f"{API_BASE}/analytics/promo-lift").json())
            st.dataframe(df, use_container_width=True)
        except Exception:
            st.info("Generate data first.")

    with col_shrink:
        st.markdown("#### Shrinkage Summary (Top 20)")
        try:
            df = pd.DataFrame(requests.get(f"{API_BASE}/analytics/shrinkage").json())
            st.dataframe(df, use_container_width=True)
        except Exception:
            st.info("Unavailable.")

    st.markdown("#### Demand Anomalies")
    try:
        df = pd.DataFrame(requests.get(f"{API_BASE}/analytics/anomalies").json())
        st.dataframe(df, use_container_width=True)
    except Exception:
        st.info("Unavailable.")

    # Demand charts
    st.subheader("Demand Charts")

    df_demand = pd.read_csv("data/synthetic/demand_history.csv", parse_dates=["date"])

    chart_cols = st.columns(3)

    with chart_cols[0]:
        st.markdown("#### Daily Demand Trend")
        daily = df_demand.groupby("date")["units_sold"].sum().reset_index()
        st.line_chart(daily.set_index("date"))

    with chart_cols[1]:
        st.markdown("#### Promo vs Non-Promo Demand")
        promo_compare = df_demand.groupby("promo_flag")["units_sold"].mean().reset_index()
        promo_compare["promo_flag"] = promo_compare["promo_flag"].map({0: "No Promo", 1: "Promo"})
        st.bar_chart(promo_compare.set_index("promo_flag"))

    with chart_cols[2]:
        st.markdown("#### Sales by Channel")
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
        df = pd.DataFrame(requests.get(f"{API_BASE}/analytics/supplier-risk").json())
        st.dataframe(df, use_container_width=True)
    except Exception:
        st.info("Unavailable.")

    # Supplier charts
    st.subheader("Supplier Charts")

    df_suppliers = pd.read_csv("data/synthetic/supplier.csv")

    chart_cols = st.columns(3)

    with chart_cols[0]:
        st.markdown("#### On-time Delivery Rate Distribution")
        hist_on_time = alt.Chart(df_suppliers).mark_bar().encode(
            x=alt.X("on_time_rate:Q", bin=True),
            y="count()"
        )
        st.altair_chart(hist_on_time, use_container_width=True)

    with chart_cols[1]:
        st.markdown("#### Defect Rate Distribution")
        hist_defect = alt.Chart(df_suppliers).mark_bar().encode(
            x=alt.X("defect_rate:Q", bin=True),
            y="count()"
        )
        st.altair_chart(hist_defect, use_container_width=True)

    with chart_cols[2]:
        st.markdown("#### Supplier Risk Score (Top 20)")
        top_risk = pd.DataFrame(requests.get(f"{API_BASE}/analytics/supplier-risk").json())
        if not top_risk.empty:
            st.bar_chart(top_risk.set_index("supplier_id")["risk_score"])



# ------------------------------------------------------
# SHIPMENTS / LEAD TIME ANALYTICS
# ------------------------------------------------------
with tab_shipments:
    st.subheader("Shipment Summary")
    try:
        resp = requests.get(f"{API_BASE}/analytics/shipments-summary")
        st.json(resp.json()["summary"])
    except:
        st.info("No data.")

    st.subheader("Shipment Exceptions")
    try:
        df = pd.DataFrame(requests.get(f"{API_BASE}/analytics/shipment-delays").json())
        st.dataframe(df, use_container_width=True)
    except Exception:
        st.info("Unavailable.")

    st.subheader("Shipment Charts")

    df_ship = pd.read_csv(
        "data/synthetic/shipments.csv", parse_dates=["date_shipped", "date_received"]
    )
    df_ship["transit_days"] = (df_ship["date_received"] - df_ship["date_shipped"]).dt.days

    chart_cols = st.columns(2)

    with chart_cols[0]:
        st.markdown("#### Transit Time Distribution")
        hist_transit = alt.Chart(df_ship).mark_bar().encode(
            x=alt.X("transit_days:Q", bin=True),
            y="count()"
        )
        st.altair_chart(hist_transit, use_container_width=True)

    with chart_cols[1]:
        st.markdown("#### Shipment Volume by Supplier (Top 20)")
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
                df_forecast = pd.DataFrame(resp.json())  # columns: date, forecast_units
                df_forecast["date"] = pd.to_datetime(df_forecast["date"])   # ensure consistency

                # Load historical demand for this item
                df_hist = pd.read_csv("data/synthetic/demand_history.csv", parse_dates=["date"])
                df_hist_item = df_hist[df_hist["item_id"] == item_id]

                hist_daily = (
                    df_hist_item.groupby("date")["units_sold"].sum().reset_index()
                )

                # ---- Build Actual vs Forecast plotting frame ----
                df_actual_plot = (
                    hist_daily
                    .set_index("date")[["units_sold"]]
                    .rename(columns={"units_sold": "Actual"})
                )

                df_forecast_plot = (
                    df_forecast
                    .set_index("date")[["forecast_units"]]
                    .rename(columns={"forecast_units": "Forecast"})
                )

                # Make sure both have datetime index
                df_actual_plot.index = pd.to_datetime(df_actual_plot.index)
                df_forecast_plot.index = pd.to_datetime(df_forecast_plot.index)

                # Join on timeline → gives a 2-line chart
                df_plot = df_actual_plot.join(df_forecast_plot, how="outer")

                st.markdown("### Actual vs Forecast Demand")
                st.line_chart(df_plot)

                # ---- Forecast Table ----
                st.markdown("### Forecast Table")
                st.dataframe(df_forecast)

                # ---- Smoothed Forecast Trend ----
                st.markdown("### Smoothed Forecast Trend")

                df_forecast_sm = df_forecast.copy()
                df_forecast_sm["smoothed"] = (
                    df_forecast_sm["forecast_units"]
                    .rolling(3, min_periods=1)
                    .mean()
                )

                st.line_chart(
                    df_forecast_sm.set_index("date")[["forecast_units", "smoothed"]]
                )

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
