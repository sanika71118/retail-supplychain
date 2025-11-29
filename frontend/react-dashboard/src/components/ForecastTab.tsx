import { useState } from 'react';
import { Card, InputNumber, Slider, Button, Alert, Spin, Typography, Space, Table } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getForecast } from '../services/api';
import type { ForecastData } from '../types';

const { Title } = Typography;

const ForecastTab = () => {
  const [loading, setLoading] = useState(false);
  const [itemId, setItemId] = useState(1);
  const [periods, setPeriods] = useState(7);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleRunForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getForecast(itemId, periods);
      setForecastData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch forecast. Please try again.');
      setForecastData([]);
    } finally {
      setLoading(false);
    }
  };

  const forecastColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
    },
    {
      title: 'Forecast Units',
      dataIndex: 'forecast_units',
      key: 'forecast_units',
      width: 150,
      render: (val: number) => val.toFixed(2),
    },
  ];

  return (
    <div>
      <Title level={4}>Item Demand Forecast</Title>

      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Typography.Text strong>Item ID:</Typography.Text>
            <InputNumber
              min={1}
              value={itemId}
              onChange={(val) => setItemId(val || 1)}
              style={{ marginLeft: '12px', width: '200px' }}
            />
          </div>

          <div>
            <Typography.Text strong>Forecast Horizon (days):</Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <Slider
                min={3}
                max={30}
                value={periods}
                onChange={setPeriods}
                style={{ flex: 1 }}
              />
              <InputNumber
                min={3}
                max={30}
                value={periods}
                onChange={(val) => setPeriods(val || 7)}
                style={{ width: '80px' }}
              />
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            onClick={handleRunForecast}
            loading={loading}
          >
            Run Forecast
          </Button>
        </Space>
      </Card>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Generating forecast..." />
        </div>
      )}

      {!loading && forecastData.length > 0 && (
        <>
          <Card title="Forecast Visualization" style={{ marginBottom: '24px' }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Forecast Units', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="forecast_units"
                  stroke="#1890ff"
                  strokeWidth={2}
                  name="Forecast Units"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Forecast Table">
            <Table
              dataSource={forecastData}
              columns={forecastColumns}
              pagination={false}
              size="small"
              rowKey="date"
            />
          </Card>
        </>
      )}

      {!loading && forecastData.length === 0 && !error && (
        <Alert
          message="No Forecast Data"
          description="Click 'Run Forecast' to generate predictions."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default ForecastTab;
