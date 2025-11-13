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

        inventory.append({
            "item_id": i + 1,
            "name": fake.word(),
            "category": category,
            "stock": random.randint(0, 2000),
            "reorder_point": random.randint(20, 200),
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
        suppliers.append({
            "supplier_id": i + 1,
            "supplier_name": fake.company(),
            "on_time_rate": round(random.uniform(0.5, 0.99), 2),
            "defect_rate": round(random.uniform(0.01, 0.15), 2),
            "lead_time_days": random.randint(1, 45)
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
        received_date = fake.date_between(start_date=shipped_date, end_date='today')

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
