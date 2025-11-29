#%%
import pandas as pd
import numpy as np
from faker import Faker
import random
from pathlib import Path
from .config import SYNTHETIC_DIR

fake = Faker()

# ============================================
# INVENTORY (5000 SKUs)
# ============================================
def gen_inventory(n=5000):
    categories = ["Grocery", "Electronics", "Home", "Apparel"]
    inventory = []

    for i in range(n):
        category = random.choice(categories)
        base_cost = random.uniform(2, 300)

        # Create more variation in stock levels - use different ranges
        stock_tier = random.random()
        if stock_tier < 0.3:  # Low stock items
            stock = random.randint(0, 500)
            reorder = random.randint(100, 400)
        elif stock_tier < 0.6:  # Medium stock items
            stock = random.randint(500, 1500)
            reorder = random.randint(50, 300)
        else:  # High stock items
            stock = random.randint(1500, 3000)
            reorder = random.randint(20, 200)

        inventory.append({
            "item_id": i + 1,
            "name": fake.word(),
            "category": category,
            "stock": stock,
            "reorder_point": reorder,
            "unit_cost": round(base_cost, 2),
            "selling_price": round(base_cost * random.uniform(1.15, 2.5), 2)
        })

    return pd.DataFrame(inventory)


# ============================================
# DEMAND HISTORY (5000 rows)
# ============================================
def gen_demand(n_rows=5000, n_items=5000):
    rows = []
    dates = pd.date_range(end=pd.Timestamp.today(), periods=60)

    for _ in range(n_rows):
        item = random.randint(1, n_items)
        d = random.choice(dates)
        promo = random.choice([0,0,0,1])      # 25% promo chance
        multiplier = 2 if promo else 1

        rows.append({
            "date": d,
            "item_id": item,
            "units_sold": np.random.poisson(5) * multiplier,
            "channel": random.choice(["Online", "Store"]),
            "promo_flag": promo,
            "shrinkage": np.random.binomial(1, 0.03)
        })

    return pd.DataFrame(rows)


# ============================================
# SUPPLIERS (5000 rows)
# ============================================
def gen_suppliers(n=5000):
    suppliers = []

    for i in range(n):
        # Create supplier performance tiers for more variation
        tier = random.random()
        if tier < 0.2:  # Excellent suppliers (20%)
            on_time = round(random.uniform(0.85, 0.99), 2)
            defect = round(random.uniform(0.01, 0.05), 2)
            lead_time = random.randint(1, 15)
        elif tier < 0.5:  # Good suppliers (30%)
            on_time = round(random.uniform(0.70, 0.85), 2)
            defect = round(random.uniform(0.05, 0.10), 2)
            lead_time = random.randint(10, 25)
        elif tier < 0.8:  # Average suppliers (30%)
            on_time = round(random.uniform(0.55, 0.70), 2)
            defect = round(random.uniform(0.08, 0.15), 2)
            lead_time = random.randint(20, 35)
        else:  # Poor suppliers (20%)
            on_time = round(random.uniform(0.40, 0.60), 2)
            defect = round(random.uniform(0.12, 0.25), 2)
            lead_time = random.randint(30, 60)

        suppliers.append({
            "supplier_id": i + 1,
            "supplier_name": fake.company(),
            "on_time_rate": on_time,
            "defect_rate": defect,
            "lead_time_days": lead_time
        })

    return pd.DataFrame(suppliers)


# ============================================
# SHIPMENTS (5000 rows)
# ============================================
def gen_shipments(n=5000, n_items=5000, n_suppliers=5000):
    shipments = []

    for i in range(n):
        item = random.randint(1, n_items)
        supplier = random.randint(1, n_suppliers)
        shipped_date = fake.date_between(start_date='-120d', end_date='-5d')

        # Create varied transit times - some shipments are fast, some slow
        transit_variation = random.random()
        if transit_variation < 0.3:  # Fast shipments (30%)
            transit_days = random.randint(1, 30)
        elif transit_variation < 0.6:  # Normal shipments (30%)
            transit_days = random.randint(30, 80)
        elif transit_variation < 0.9:  # Slow shipments (30%)
            transit_days = random.randint(80, 110)
        else:  # Very slow shipments (10%)
            transit_days = random.randint(110, 150)

        received_date = shipped_date + pd.Timedelta(days=transit_days)

        shipments.append({
            "shipment_id": i + 1,
            "item_id": item,
            "qty": random.randint(10, 500),
            "date_shipped": shipped_date,
            "date_received": received_date,
            "supplier_id": supplier
        })

    return pd.DataFrame(shipments)


# ============================================
# MASTER SAVE FUNCTION
# ============================================
def save_synthetic_data():
    print("Generating large synthetic retail dataset...")

    inventory = gen_inventory()
    demand = gen_demand()
    suppliers = gen_suppliers()
    shipments = gen_shipments()

    inv_path = SYNTHETIC_DIR / "inventory.csv"
    demand_path = SYNTHETIC_DIR / "demand_history.csv"
    supplier_path = SYNTHETIC_DIR / "supplier.csv"
    shipment_path = SYNTHETIC_DIR / "shipments.csv"

    inventory.to_csv(inv_path, index=False)
    demand.to_csv(demand_path, index=False)
    suppliers.to_csv(supplier_path, index=False)
    shipments.to_csv(shipment_path, index=False)

    return {
        "inventory": str(inv_path),
        "demand_history": str(demand_path),
        "suppliers": str(supplier_path),
        "shipments": str(shipment_path)
    }

# %%
