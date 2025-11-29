export interface AnalyticsSummary {
  summary: Record<string, any>;
  shape: [number, number];
}

export interface StockoutRisk {
  item_id: number;
  stock: number;
  avg_daily_demand: number;
  days_of_supply: number;
}

export interface ExcessInventory {
  item_id: number;
  stock: number;
  avg_daily_demand: number;
  excess_units: number;
}

export interface PromoLift {
  item_id: number;
  avg_promo_units: number;
  avg_non_promo_units: number;
  lift_pct: number;
}

export interface Shrinkage {
  item_id: number;
  total_shrink: number;
}

export interface Anomaly {
  date: string;
  item_id: number;
  units_sold: number;
  z_score: number;
}

export interface SupplierRisk {
  supplier_id: number;
  on_time_rate: number;
  defect_rate: number;
  risk_score: number;
}

export interface ShipmentDelay {
  shipment_id: number;
  supplier_id: number;
  transit_days: number;
}

export interface ForecastData {
  date: string;
  forecast_units: number;
}

export interface RAGResponse {
  answer: string;
  retrieved_context: string[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}
