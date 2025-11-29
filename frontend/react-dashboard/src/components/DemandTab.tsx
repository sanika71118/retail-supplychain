import { useState, useEffect } from 'react';
import { Card, Table, Alert, Spin, Row, Col, Typography, Statistic } from 'antd';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getDemandSummary, getPromoLift, getShrinkage, getAnomalies } from '../services/api';
import type { PromoLift, Shrinkage, Anomaly } from '../types';

const { Title } = Typography;

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

          {/* Anomalies Time Series */}
          {anomalies.length > 0 && (
            <>
              <Card title="Demand Anomalies" style={{ marginTop: '24px' }}>
                <Table
                  dataSource={anomalies}
                  columns={anomalyColumns}
                  pagination={{ pageSize: 10 }}
                  size="small"
                  rowKey={(record) => `${record.date}-${record.item_id}`}
                />
              </Card>

              <Card title="Anomaly Pattern Over Time" style={{ marginTop: '24px' }}>
                <ResponsiveContainer width="100%" height={350}>
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
            </>
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
