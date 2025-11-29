import { useState, useEffect } from 'react';
import { Card, Table, Alert, Spin, Row, Col, Typography, Statistic } from 'antd';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getDemandSummary, getAnomalies } from '../services/api';
import type { Anomaly } from '../types';

const { Title } = Typography;

const DemandTab = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, anomalyData] = await Promise.all([
        getDemandSummary(),
        getAnomalies(),
      ]);
      setSummary(summaryData);
      setAnomalies(anomalyData);
    } catch (error) {
      console.error('Error fetching demand data:', error);
    } finally {
      setLoading(false);
    }
  };

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
