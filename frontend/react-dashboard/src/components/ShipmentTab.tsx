import { useState, useEffect } from 'react';
import { Card, Table, Alert, Spin, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getShipmentsSummary, getShipmentDelays } from '../services/api';
import type { ShipmentDelay } from '../types';

const { Title } = Typography;

const ShipmentTab = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [delays, setDelays] = useState<ShipmentDelay[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, delayData] = await Promise.all([
        getShipmentsSummary(),
        getShipmentDelays(),
      ]);
      setSummary(summaryData);
      setDelays(delayData);
    } catch (error) {
      console.error('Error fetching shipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const delayColumns = [
    { title: 'Shipment ID', dataIndex: 'shipment_id', key: 'shipment_id', width: 120 },
    { title: 'Supplier ID', dataIndex: 'supplier_id', key: 'supplier_id', width: 120 },
    { title: 'Transit Days', dataIndex: 'transit_days', key: 'transit_days', width: 120 },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading shipment data..." />
      </div>
    );
  }

  return (
    <div>
      <Title level={4}>Shipments & Lead Times</Title>

      {summary ? (
        <>
          <Card style={{ marginBottom: '24px' }}>
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(summary.summary, null, 2)}
            </pre>
          </Card>

          <Card title="Longest Transit Times (Top 50)" style={{ marginBottom: '24px' }}>
            <Table
              dataSource={delays}
              columns={delayColumns}
              pagination={{ pageSize: 20 }}
              size="small"
              rowKey="shipment_id"
            />
          </Card>

          <Card title="Transit Time Distribution (Top 20)">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={delays.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shipment_id" />
                <YAxis label={{ value: 'Transit Days', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="transit_days" fill="#faad14" name="Transit Days" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      ) : (
        <Alert
          message="No Data Available"
          description="Please generate synthetic data first using the button in the sidebar."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default ShipmentTab;
