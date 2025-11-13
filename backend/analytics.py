import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any

from statsmodels.tsa.arima.model import ARIMA
from sklearn.ensemble import IsolationForest

from .config import SYNTHETIC_DIR

# ======================================================
# LOADERS
# ======================================================

def load_inventory() -> pd.DataFrame:
    return pd.read_csv(SYNTHETIC_DIR / "inventory.csv")


def load_demand() -> pd.DataFrame:
    df = pd.read_csv(SYNTHETIC_DIR / "demand_history.csv", parse_dates=["date"])
    return df


def load_suppliers() -> pd.DataFrame:
    return pd.read_csv(SYNTHETIC_DIR / "supplier.csv")


def load_shipments() -> pd.DataFrame:
    df = pd.read_csv(
        SYNTHETIC_DIR / "shipments.csv",
        parse_dates=["date_shipped", "date_received"]
    )
    return df


# ======================================================
# GENERIC SUMMARY
# ======================================================

def analytics_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Basic summary for any dataframe: shape, numeric stats, nulls.
    """
    return {
        "shape": list(df.shape),
        "summary": df.describe(include="all").to_dict(),
        "null_counts": df.isna().sum().to_dict()
    }


# ======================================================
# INVENTORY & DEMAND ANALYTICS
# ======================================================

def stockout_risk(inventory: pd.DataFrame, demand: pd.DataFrame) -> pd.DataFrame:
    """
    Estimate days until stockout for each item based on average daily sales.
    Lower days_until_stockout = higher risk.
    """
    # avg daily demand per item
    demand_daily = (
        demand.groupby(["item_id", "date"])["units_sold"]
        .sum()
        .groupby("item_id")
        .mean()
    )

    inv = inventory.merge(demand_daily.rename("avg_daily_units"), on="item_id", how="left")
    inv["avg_daily_units"].fillna(0.1, inplace=True)  # avoid division by 0

    inv["days_until_stockout"] = inv["stock"] / inv["avg_daily_units"]
    inv = inv.sort_values("days_until_stockout")

    return inv[[
        "item_id", "name", "category", "stock", "reorder_point",
        "avg_daily_units", "days_until_stockout"
    ]]


def excess_inventory(inventory: pd.DataFrame) -> pd.DataFrame:
    """
    Items with stock significantly above their reorder point.
    """
    inv = inventory.copy()
    inv["excess_units"] = inv["stock"] - inv["reorder_point"]
    inv = inv[inv["excess_units"] > 0].sort_values("excess_units", ascending=False)

    return inv[[
        "item_id", "name", "category", "stock", "reorder_point", "excess_units"
    ]]


def shrinkage_summary(demand: pd.DataFrame) -> pd.DataFrame:
    """
    Shrinkage per item and shrinkage rate.
    """
    agg = demand.groupby("item_id").agg(
        total_units_sold=("units_sold", "sum"),
        total_shrinkage=("shrinkage", "sum")
    ).reset_index()

    agg["shrinkage_rate"] = np.where(
        agg["total_units_sold"] > 0,
        agg["total_shrinkage"] / agg["total_units_sold"],
        0.0
    )

    return agg.sort_values("total_shrinkage", ascending=False)


def promo_lift(demand: pd.DataFrame) -> pd.DataFrame:
    """
    Measures promo lift per item: (promo_mean - nonpromo_mean) / nonpromo_mean.
    """
    promo = demand[demand["promo_flag"] == 1].groupby("item_id")["units_sold"].mean()
    nonpromo = demand[demand["promo_flag"] == 0].groupby("item_id")["units_sold"].mean()

    df = pd.DataFrame({
        "promo_mean": promo,
        "nonpromo_mean": nonpromo
    }).dropna()

    df["promo_lift"] = (df["promo_mean"] - df["nonpromo_mean"]) / df["nonpromo_mean"]
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(subset=["promo_lift"], inplace=True)

    df = df.reset_index().sort_values("promo_lift", ascending=False)

    return df[["item_id", "promo_mean", "nonpromo_mean", "promo_lift"]]


def detect_anomalies(demand: pd.DataFrame, contamination: float = 0.02) -> pd.DataFrame:
    """
    Detects demand anomalies using IsolationForest on units_sold.
    """
    model = IsolationForest(contamination=contamination, random_state=42)
    tmp = demand.copy()
    tmp["anomaly"] = model.fit_predict(tmp[["units_sold"]])

    anomalies = tmp[tmp["anomaly"] == -1]
    return anomalies[["date", "item_id", "units_sold", "channel", "promo_flag", "shrinkage"]]


# ======================================================
# FORECASTING
# ======================================================

def forecast_item(demand: pd.DataFrame, item_id: int, periods: int = 7) -> pd.DataFrame:
    """
    Simple ARIMA forecast for a single item's daily demand.
    """
    series = (
        demand[demand["item_id"] == item_id]
        .set_index("date")["units_sold"]
        .asfreq("D")
        .fillna(0)
    )

    if len(series) < 20:
        raise ValueError("Not enough history for ARIMA forecasting for this item.")

    model = ARIMA(series, order=(2, 1, 2))
    model_fit = model.fit()
    forecast = model_fit.forecast(periods)

    out = forecast.reset_index()
    out.columns = ["date", "forecast_units"]
    return out


# ======================================================
# SUPPLIER & SHIPMENT ANALYTICS
# ======================================================

def supplier_risk(suppliers: pd.DataFrame) -> pd.DataFrame:
    """
    Composite supplier risk score using on_time_rate, defect_rate, and lead_time_days.
    Higher score = riskier supplier.
    """
    sup = suppliers.copy()

    # Normalize lead time roughly between 0 and 1
    max_lead = sup["lead_time_days"].max() if not sup["lead_time_days"].empty else 1
    sup["lead_time_norm"] = sup["lead_time_days"] / max_lead

    sup["risk_score"] = (
        (1 - sup["on_time_rate"]) * 0.5 +
        sup["defect_rate"] * 0.3 +
        sup["lead_time_norm"] * 0.2
    )

    sup = sup.sort_values("risk_score", ascending=False)

    return sup[[
        "supplier_id", "supplier_name", "on_time_rate",
        "defect_rate", "lead_time_days", "risk_score"
    ]]


def shipment_delay_summary(shipments: pd.DataFrame) -> pd.DataFrame:
    """
    Computes transit time per shipment and highlights slow shipments.
    """
    shp = shipments.copy()
    shp["transit_days"] = (shp["date_received"] - shp["date_shipped"]).dt.days

    summary = shp[["shipment_id", "item_id", "supplier_id", "qty", "date_shipped", "date_received", "transit_days"]]

    return summary.sort_values("transit_days", ascending=False)
