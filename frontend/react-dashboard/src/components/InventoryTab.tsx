import { useState, useEffect } from 'react';
import { Card, Table, Alert, Spin, Row, Col, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getInventorySummary, getStockoutRisk, getExcessInventory } from '../services/api';
import type { StockoutRisk, ExcessInventory } from '../types';

const { Title } = Typography;

const InventoryTab = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [stockoutRisk, setStockoutRisk] = useState<StockoutRisk[]>([]);
  const [excessInventory, setExcessInventory] = useState<ExcessInventory[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, stockoutData, excessData] = await Promise.all([
        getInventorySummary(),
        getStockoutRisk(),
        getExcessInventory(),
      ]);
      setSummary(summaryData);
      setStockoutRisk(stockoutData);
      setExcessInventory(excessData);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stockoutColumns = [
    { title: 'Item ID', dataIndex: 'item_id', key: 'item_id', width: 100 },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', width: 100 },
    { title: 'Avg Daily Demand', dataIndex: 'avg_daily_demand', key: 'avg_daily_demand', width: 150,
      render: (val: number) => val.toFixed(2) },
    { title: 'Days of Supply', dataIndex: 'days_of_supply', key: 'days_of_supply', width: 150,
      render: (val: number) => val.toFixed(2) },
  ];

  const excessColumns = [
    { title: 'Item ID', dataIndex: 'item_id', key: 'item_id', width: 100 },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', width: 100 },
    { title: 'Avg Daily Demand', dataIndex: 'avg_daily_demand', key: 'avg_daily_demand', width: 150,
      render: (val: number) => val.toFixed(2) },
    { title: 'Excess Units', dataIndex: 'excess_units', key: 'excess_units', width: 150,
      render: (val: number) => val.toFixed(0) },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading inventory data..." />
      </div>
    );
  }

  return (
    <div>
      <Title level={4}>Inventory Summary</Title>

      {summary ? (
        <>
          <Card style={{ marginBottom: '24px' }}>
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(summary.summary, null, 2)}
            </pre>
            <Alert
              message={`Dataset: ${summary.shape[0]} rows × ${summary.shape[1]} columns`}
              type="info"
              style={{ marginTop: '12px' }}
            />
          </Card>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Stockout Risk (Top 20)" style={{ height: '100%' }}>
                <Table
                  dataSource={stockoutRisk}
                  columns={stockoutColumns}
                  pagination={false}
                  scroll={{ y: 300 }}
                  size="small"
                  rowKey="item_id"
                />
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Excess Inventory (Top 20)" style={{ height: '100%' }}>
                <Table
                  dataSource={excessInventory}
                  columns={excessColumns}
                  pagination={false}
                  scroll={{ y: 300 }}
                  size="small"
                  rowKey="item_id"
                />
              </Card>
            </Col>
          </Row>

          <Card title="Excess Inventory Visualization" style={{ marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={excessInventory.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="excess_units" fill="#ff7875" name="Excess Units" />
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

export default InventoryTab;
