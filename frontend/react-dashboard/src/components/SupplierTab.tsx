import { useState, useEffect } from 'react';
import { Card, Table, Alert, Spin, Typography, Row, Col, Statistic } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line } from 'recharts';
import { getSupplierSummary, getSupplierRisk } from '../services/api';
import type { SupplierRisk } from '../types';

const { Title } = Typography;

const SupplierTab = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [supplierRisk, setSupplierRisk] = useState<SupplierRisk[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, riskData] = await Promise.all([
        getSupplierSummary(),
        getSupplierRisk(),
      ]);
      setSummary(summaryData);
      setSupplierRisk(riskData);
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const riskColumns = [
    { title: 'Supplier ID', dataIndex: 'supplier_id', key: 'supplier_id', width: 120 },
    { title: 'On-Time Rate', dataIndex: 'on_time_rate', key: 'on_time_rate', width: 130,
      render: (val: number) => val != null ? `${(val * 100).toFixed(1)}%` : 'N/A' },
    { title: 'Defect Rate', dataIndex: 'defect_rate', key: 'defect_rate', width: 130,
      render: (val: number) => val != null ? `${(val * 100).toFixed(1)}%` : 'N/A' },
    { title: 'Risk Score', dataIndex: 'risk_score', key: 'risk_score', width: 120,
      render: (val: number) => val != null ? val.toFixed(2) : 'N/A' },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading supplier data..." />
      </div>
    );
  }

  // Add jitter to scatter plot data to handle overlapping points
  const scatterDataWithJitter = supplierRisk.map((item) => ({
    ...item,
    on_time_rate_jitter: item.on_time_rate + (Math.random() - 0.5) * 0.05,
    defect_rate_jitter: item.defect_rate + (Math.random() - 0.5) * 0.02,
  }));

  // Calculate summary stats
  const avgOnTimeRate = supplierRisk.length > 0
    ? (supplierRisk.reduce((sum, s) => sum + s.on_time_rate, 0) / supplierRisk.length * 100)
    : 0;
  const avgDefectRate = supplierRisk.length > 0
    ? (supplierRisk.reduce((sum, s) => sum + s.defect_rate, 0) / supplierRisk.length * 100)
    : 0;
  const avgRiskScore = supplierRisk.length > 0
    ? (supplierRisk.reduce((sum, s) => sum + s.risk_score, 0) / supplierRisk.length)
    : 0;

  return (
    <div>
      <Title level={4}>Supplier Analytics</Title>

      {summary ? (
        <>
          {/* Summary Statistics Cards */}
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="Total Suppliers"
                  value={supplierRisk.length}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Avg On-Time Rate"
                  value={avgOnTimeRate.toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Avg Defect Rate"
                  value={avgDefectRate.toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Avg Risk Score"
                  value={avgRiskScore.toFixed(2)}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="Supplier Risk (Top 20)" style={{ marginBottom: '24px' }}>
            <Table
              dataSource={supplierRisk}
              columns={riskColumns}
              pagination={false}
              scroll={{ y: 350 }}
              size="small"
              rowKey="supplier_id"
            />
          </Card>

          {/* Risk Score Distribution */}
          <Card title="Risk Score Distribution (Top 15)" style={{ marginBottom: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supplierRisk.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplier_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="risk_score" fill="#ff4d4f" name="Risk Score" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* On-Time Rate vs Defect Rate Scatter (with jitter) */}
          <Card title="On-Time Rate vs Defect Rate" style={{ marginBottom: '24px' }}>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="on_time_rate_jitter"
                  name="On-Time Rate"
                  label={{ value: 'On-Time Rate', position: 'bottom', offset: 5 }}
                  domain={[0.45, 0.60]}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <YAxis
                  type="number"
                  dataKey="defect_rate_jitter"
                  name="Defect Rate"
                  label={{ value: 'Defect Rate', angle: -90, position: 'insideLeft' }}
                  domain={[0.05, 0.18]}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'On-Time Rate') return `${(value * 100).toFixed(1)}%`;
                    if (name === 'Defect Rate') return `${(value * 100).toFixed(1)}%`;
                    return value;
                  }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Legend />
                <Scatter
                  name="Suppliers"
                  data={scatterDataWithJitter}
                  fill="#8884d8"
                  fillOpacity={0.5}
                  shape="circle"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>

          {/* Performance Metrics Comparison */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={12}>
              <Card title="On-Time Rate by Supplier (Top 10)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={supplierRisk.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="supplier_id" />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <Tooltip formatter={(value: any) => `${(value * 100).toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="on_time_rate" fill="#52c41a" name="On-Time Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Defect Rate by Supplier (Top 10)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={supplierRisk.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="supplier_id" />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <Tooltip formatter={(value: any) => `${(value * 100).toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="defect_rate" fill="#ff4d4f" name="Defect Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Combined Metrics Line Chart */}
          <Card title="Supplier Metrics Trend (Top 15)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={supplierRisk.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplier_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="on_time_rate" stroke="#52c41a" name="On-Time Rate" />
                <Line type="monotone" dataKey="defect_rate" stroke="#ff4d4f" name="Defect Rate" />
                <Line type="monotone" dataKey="risk_score" stroke="#1890ff" name="Risk Score (scaled)" />
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

export default SupplierTab;
