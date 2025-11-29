import { useState, useEffect } from 'react';
import { Card, Table, Alert, Spin, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
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

  return (
    <div>
      <Title level={4}>Supplier Analytics</Title>

      {summary ? (
        <>
          <Card style={{ marginBottom: '24px' }}>
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(summary.summary, null, 2)}
            </pre>
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

          <Card title="Risk Score Distribution" style={{ marginBottom: '24px' }}>
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

          <Card title="On-Time Rate vs Defect Rate">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="on_time_rate"
                  name="On-Time Rate"
                  label={{ value: 'On-Time Rate', position: 'bottom' }}
                />
                <YAxis
                  type="number"
                  dataKey="defect_rate"
                  name="Defect Rate"
                  label={{ value: 'Defect Rate', angle: -90, position: 'left' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Suppliers" data={supplierRisk} fill="#8884d8" />
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

export default SupplierTab;
