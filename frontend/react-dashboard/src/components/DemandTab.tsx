import { useState, useEffect } from 'react';
import { Card, Table, Alert, Spin, Row, Col, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
      render: (val: number) => val.toFixed(2) },
    { title: 'Avg Non-Promo Units', dataIndex: 'avg_non_promo_units', key: 'avg_non_promo_units', width: 150,
      render: (val: number) => val.toFixed(2) },
    { title: 'Lift %', dataIndex: 'lift_pct', key: 'lift_pct', width: 100,
      render: (val: number) => `${val.toFixed(1)}%` },
  ];

  const shrinkageColumns = [
    { title: 'Item ID', dataIndex: 'item_id', key: 'item_id', width: 100 },
    { title: 'Total Shrink', dataIndex: 'total_shrink', key: 'total_shrink', width: 150,
      render: (val: number) => val.toFixed(0) },
  ];

  const anomalyColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
    { title: 'Item ID', dataIndex: 'item_id', key: 'item_id', width: 100 },
    { title: 'Units Sold', dataIndex: 'units_sold', key: 'units_sold', width: 120 },
    { title: 'Z-Score', dataIndex: 'z_score', key: 'z_score', width: 120,
      render: (val: number) => val.toFixed(2) },
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
          <Card style={{ marginBottom: '24px' }}>
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(summary.summary, null, 2)}
            </pre>
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

          <Card title="Promo Lift Visualization" style={{ marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
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
