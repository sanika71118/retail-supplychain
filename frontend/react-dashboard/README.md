# Retail SupplyChainIQ - React Dashboard

Modern, responsive React dashboard for the Retail SupplyChainIQ platform, featuring AI-powered analytics and forecasting.

## Features

- **Inventory Management**: Track stock levels, identify stockout risks, and manage excess inventory
- **Demand Analysis**: Analyze sales trends, promotional lift, and detect demand anomalies
- **Supplier Analytics**: Monitor supplier performance, risk scores, and delivery metrics
- **Shipment Tracking**: View transit times and identify shipping delays
- **Demand Forecasting**: ML-powered demand predictions with interactive visualizations
- **AI Assistant**: RAG-based supply chain analyst for business insights

## Tech Stack

- **React 19** with TypeScript
- **Ant Design** for UI components
- **Recharts** for data visualizations
- **Axios** for API calls
- **Vite** for fast development and building

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start development server (runs on http://localhost:5173)
npm run dev
```

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Backend Configuration

The dashboard connects to the FastAPI backend at `http://localhost:8000`. Make sure the backend is running before using the dashboard.

To start the backend:

```bash
cd ../../backend
uvicorn api:app --reload
```

## Usage

1. Start the FastAPI backend
2. Start the React development server
3. Open http://localhost:5173 in your browser
4. Click "Generate Data" in the sidebar to create synthetic data
5. Explore the different tabs to view analytics and insights

## Project Structure

```
src/
├── components/          # Tab components
│   ├── InventoryTab.tsx
│   ├── DemandTab.tsx
│   ├── SupplierTab.tsx
│   ├── ShipmentTab.tsx
│   ├── ForecastTab.tsx
│   └── AIAssistantTab.tsx
├── services/           # API service layer
│   └── api.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main application component
├── App.css             # Application styles
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Environment Variables

No environment variables are required for the frontend. The API base URL is set to `http://localhost:8000` by default.

To change the API URL, edit `src/services/api.ts`:

```typescript
const API_BASE = 'http://your-api-url:port';
```
