import { useState, useEffect } from 'react';
import { Card, Table, Alert, Spin, Typography, Row, Col, Statistic } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';
import { getShipmentsSummary, getShipmentDelays } from '../services/api';
import type { ShipmentDelay } from '../types';

const { Title } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

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

  // Calculate summary statistics
  const avgTransitDays = delays.length > 0
    ? delays.reduce((sum, d) => sum + d.transit_days, 0) / delays.length
    : 0;
  const maxTransitDays = delays.length > 0
    ? Math.max(...delays.map(d => d.transit_days))
    : 0;
  const minTransitDays = delays.length > 0
    ? Math.min(...delays.map(d => d.transit_days))
    : 0;

  // Group by supplier for analysis
  const supplierStats = delays.reduce((acc: any, delay) => {
    if (!acc[delay.supplier_id]) {
      acc[delay.supplier_id] = { supplier_id: delay.supplier_id, total_days: 0, count: 0 };
    }
    acc[delay.supplier_id].total_days += delay.transit_days;
    acc[delay.supplier_id].count += 1;
    return acc;
  }, {});

  const supplierAvgTransit = Object.values(supplierStats).map((stat: any) => ({
    supplier_id: stat.supplier_id,
    avg_transit_days: stat.total_days / stat.count,
    shipment_count: stat.count,
  })).sort((a: any, b: any) => b.avg_transit_days - a.avg_transit_days).slice(0, 15);

  return (
    <div>
      <Title level={4}>Shipments & Lead Times</Title>

      {summary ? (
        <>
          {/* Summary Statistics Cards */}
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="Total Shipments"
                  value={delays.length}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Avg Transit Days"
                  value={avgTransitDays.toFixed(1)}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Max Transit Days"
                  value={maxTransitDays}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Min Transit Days"
                  value={minTransitDays}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
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

          {/* Transit Time Distribution */}
          <Card title="Transit Time Distribution (Top 20 Shipments)" style={{ marginBottom: '24px' }}>
            <ResponsiveContainer width="100%" height={350}>
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

          {/* Shipment Count by Supplier */}
          <Card title="Shipment Count by Supplier (Top 6)" style={{ marginBottom: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={supplierAvgTransit.slice(0, 6).map(item => ({
                    name: `Supplier ${item.supplier_id}`,
                    value: item.shipment_count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value} shipments`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {supplierAvgTransit.slice(0, 6).map((_item, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Supplier vs Transit Days Scatter */}
          <Card title="Supplier Performance Scatter Plot">
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="supplier_id"
                  name="Supplier ID"
                  label={{ value: 'Supplier ID', position: 'bottom', offset: 0 }}
                />
                <YAxis
                  type="number"
                  dataKey="transit_days"
                  name="Transit Days"
                  label={{ value: 'Transit Days', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Shipments" data={delays.slice(0, 50)} fill="#ff7875" fillOpacity={0.6} />
              </ScatterChart>
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
