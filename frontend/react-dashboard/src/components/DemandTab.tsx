import { useState, useEffect } from 'react';
import { Card, Table, Alert, Spin, Row, Col, Typography, Statistic } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getDemandSummary, getPromoLift, getShrinkage, getAnomalies } from '../services/api';
import type { PromoLift, Shrinkage, Anomaly } from '../types';

const { Title } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DemandTab = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [promoLift, setPromoLift] = useState<PromoLift[]>([]);
  const [shrinkage, setShrinkage] = useState<Shrinkage[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, promoData, shrinkData, anomalyData] = await Promise.all([
        getDemandSummary(),
        getPromoLift(),
        getShrinkage(),
        getAnomalies(),
      ]);
      setSummary(summaryData);
      setPromoLift(promoData);
      setShrinkage(shrinkData);
      setAnomalies(anomalyData);
    } catch (error) {
      console.error('Error fetching demand data:', error);
    } finally {
      setLoading(false);
    }
  };

  const promoColumns = [
    { title: 'Item ID', dataIndex: 'item_id', key: 'item_id', width: 100 },
    { title: 'Avg Promo Units', dataIndex: 'avg_promo_units', key: 'avg_promo_units', width: 150,
      render: (val: number) => val != null ? val.toFixed(2) : 'N/A' },
    { title: 'Avg Non-Promo Units', dataIndex: 'avg_non_promo_units', key: 'avg_non_promo_units', width: 150,
      render: (val: number) => val != null ? val.toFixed(2) : 'N/A' },
    { title: 'Lift %', dataIndex: 'lift_pct', key: 'lift_pct', width: 100,
      render: (val: number) => val != null ? `${val.toFixed(1)}%` : 'N/A' },
  ];

  const shrinkageColumns = [
    { title: 'Item ID', dataIndex: 'item_id', key: 'item_id', width: 100 },
    { title: 'Total Shrink', dataIndex: 'total_shrink', key: 'total_shrink', width: 150,
      render: (val: number) => val != null ? val.toFixed(0) : 'N/A' },
  ];

  const anomalyColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
    { title: 'Item ID', dataIndex: 'item_id', key: 'item_id', width: 100 },
    { title: 'Units Sold', dataIndex: 'units_sold', key: 'units_sold', width: 120 },
    { title: 'Z-Score', dataIndex: 'z_score', key: 'z_score', width: 120,
      render: (val: number) => val != null ? val.toFixed(2) : 'N/A' },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading demand data..." />
      </div>
    );
  }

  return (
    <div>
      <Title level={4}>Demand & Sales Analysis</Title>

      {summary ? (
        <>
          {/* Summary Statistics Cards */}
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="Total Records"
                  value={summary.summary.date?.count || 0}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Unique Items"
                  value={summary.summary.item_id?.unique || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Avg Item ID"
                  value={summary.summary.item_id?.mean?.toFixed(0) || 0}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Data Points"
                  value={`${summary.shape[0]} × ${summary.shape[1]}`}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Promo Lift Analysis (Top 20)" style={{ height: '100%' }}>
                <Table
                  dataSource={promoLift}
                  columns={promoColumns}
                  pagination={false}
                  scroll={{ y: 250 }}
                  size="small"
                  rowKey="item_id"
                />
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Shrinkage Summary (Top 20)" style={{ height: '100%' }}>
                <Table
                  dataSource={shrinkage}
                  columns={shrinkageColumns}
                  pagination={false}
                  scroll={{ y: 250 }}
                  size="small"
                  rowKey="item_id"
                />
              </Card>
            </Col>
          </Row>

          {anomalies.length > 0 && (
            <Card title="Demand Anomalies" style={{ marginTop: '24px' }}>
              <Table
                dataSource={anomalies}
                columns={anomalyColumns}
                pagination={{ pageSize: 10 }}
                size="small"
                rowKey={(record) => `${record.date}-${record.item_id}`}
              />
            </Card>
          )}

          {/* Promo Lift Comparison Chart */}
          <Card title="Promo Lift Comparison (Top 15 Items)" style={{ marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={promoLift.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg_promo_units" fill="#52c41a" name="Avg Promo Units" />
                <Bar dataKey="avg_non_promo_units" fill="#1890ff" name="Avg Non-Promo Units" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Promo Lift Percentage Chart */}
          <Card title="Promo Lift Percentage (Top 10 Items)" style={{ marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={promoLift.slice(0, 10)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="item_id" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="lift_pct" fill="#ff7875" name="Lift %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Shrinkage Distribution */}
          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            <Col span={12}>
              <Card title="Shrinkage Distribution (Top 10)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={shrinkage.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="item_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_shrink" fill="#fa8c16" name="Total Shrinkage" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Top 6 Items by Shrinkage">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={shrinkage.slice(0, 6).map(item => ({
                        name: `Item ${item.item_id}`,
                        value: item.total_shrink
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {shrinkage.slice(0, 6).map((_item, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Anomalies Time Series */}
          {anomalies.length > 0 && (
            <Card title="Anomaly Pattern Over Time" style={{ marginTop: '24px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={anomalies.slice(0, 30)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="units_sold" stroke="#8884d8" name="Units Sold" />
                  <Line type="monotone" dataKey="z_score" stroke="#82ca9d" name="Z-Score" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
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

export default DemandTab;
