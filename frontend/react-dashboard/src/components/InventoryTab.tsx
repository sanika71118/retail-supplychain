import { useState, useEffect } from 'react';
import { Card, Table, Alert, Spin, Row, Col, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Area, PieChart, Pie, Cell } from 'recharts';
import { getInventorySummary, getStockoutRisk, getExcessInventory } from '../services/api';
import type { StockoutRisk, ExcessInventory } from '../types';

const { Title } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

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
      render: (val: number) => val != null ? val.toFixed(2) : 'N/A' },
    { title: 'Days of Supply', dataIndex: 'days_of_supply', key: 'days_of_supply', width: 150,
      render: (val: number) => val != null ? val.toFixed(2) : 'N/A' },
  ];

  const excessColumns = [
    { title: 'Item ID', dataIndex: 'item_id', key: 'item_id', width: 100 },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', width: 100 },
    { title: 'Avg Daily Demand', dataIndex: 'avg_daily_demand', key: 'avg_daily_demand', width: 150,
      render: (val: number) => val != null ? val.toFixed(2) : 'N/A' },
    { title: 'Excess Units', dataIndex: 'excess_units', key: 'excess_units', width: 150,
      render: (val: number) => val != null ? val.toFixed(0) : 'N/A' },
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
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card type="inner" title="Total Items">
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {summary.summary.item_id?.count?.toLocaleString() || 0}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card type="inner" title="Unique Products">
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {summary.summary.name?.unique || 0}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card type="inner" title="Categories">
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {summary.summary.category?.unique || 0}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card type="inner" title="Avg Stock Level">
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {summary.summary.stock?.mean?.toFixed(0) || 0}
                  </div>
                </Card>
              </Col>
            </Row>
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

          {/* Excess Inventory Visualization */}
          <Card title="Excess Inventory Comparison (Top 10 Items)" style={{ marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={excessInventory.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="#1890ff" name="Current Stock" />
                <Bar dataKey="excess_units" fill="#ff7875" name="Excess Units" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Stock vs Average Daily Demand */}
          <Card title="Stock Level vs Average Daily Demand (Stockout Risk)" style={{ marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={stockoutRisk.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="#69c0ff" name="Current Stock" />
                <Line type="monotone" dataKey="avg_daily_demand" stroke="#ff4d4f" strokeWidth={2} name="Avg Daily Demand" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* Days of Supply Analysis */}
          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            <Col span={12}>
              <Card title="Days of Supply (Stockout Risk Items)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stockoutRisk.slice(0, 10)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="item_id" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="days_of_supply" fill="#ffa940" name="Days of Supply" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Excess Inventory Distribution (Top 8)">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={excessInventory.slice(0, 8).map(item => ({
                        name: `Item ${item.item_id}`,
                        value: item.excess_units
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {excessInventory.slice(0, 8).map((_item, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Stock Turnover Analysis */}
          <Card title="Inventory Turnover Analysis (Top 15 Items)" style={{ marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={excessInventory.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="stock" fill="#91d5ff" stroke="#1890ff" name="Stock Level" />
                <Line type="monotone" dataKey="avg_daily_demand" stroke="#52c41a" strokeWidth={2} name="Avg Daily Demand" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* Combined Stockout and Excess View */}
          <Card title="Combined Inventory Health Overview" style={{ marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  data={stockoutRisk.slice(0, 10)}
                  type="monotone"
                  dataKey="days_of_supply"
                  stroke="#ff4d4f"
                  strokeWidth={2}
                  name="Days of Supply (Stockout Risk)"
                />
                <Line
                  data={excessInventory.slice(0, 10)}
                  type="monotone"
                  dataKey="excess_units"
                  stroke="#52c41a"
                  strokeWidth={2}
                  name="Excess Units"
                />
              </LineChart>
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
