import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Data generation
export const generateData = async () => {
  const response = await api.post('/data/generate');
  return response.data;
};

// Analytics endpoints
export const getInventorySummary = async () => {
  const response = await api.get('/analytics/inventory-summary');
  return response.data;
};

export const getStockoutRisk = async (topN: number = 20) => {
  const response = await api.get(`/analytics/stockout-risk?top_n=${topN}`);
  return response.data;
};

export const getExcessInventory = async (topN: number = 20) => {
  const response = await api.get(`/analytics/excess-inventory?top_n=${topN}`);
  return response.data;
};

export const getDemandSummary = async () => {
  const response = await api.get('/analytics/demand-summary');
  return response.data;
};

export const getPromoLift = async (topN: number = 20) => {
  const response = await api.get(`/analytics/promo-lift?top_n=${topN}`);
  return response.data;
};

export const getShrinkage = async (topN: number = 20) => {
  const response = await api.get(`/analytics/shrinkage?top_n=${topN}`);
  return response.data;
};

export const getAnomalies = async () => {
  const response = await api.get('/analytics/anomalies');
  return response.data;
};

export const getSupplierSummary = async () => {
  const response = await api.get('/analytics/supplier-summary');
  return response.data;
};

export const getSupplierRisk = async (topN: number = 20) => {
  const response = await api.get(`/analytics/supplier-risk?top_n=${topN}`);
  return response.data;
};

export const getShipmentsSummary = async () => {
  const response = await api.get('/analytics/shipments-summary');
  return response.data;
};

export const getShipmentDelays = async (topN: number = 50) => {
  const response = await api.get(`/analytics/shipment-delays?top_n=${topN}`);
  return response.data;
};

export const getForecast = async (itemId: number, periods: number = 7) => {
  const response = await api.get(`/analytics/forecast?item_id=${itemId}&periods=${periods}`);
  return response.data;
};

// RAG query
export const queryRAG = async (query: string) => {
  const response = await api.post('/rag/query', { query });
  return response.data;
};

export default api;
