import { useState, useEffect } from 'react';
import { Layout, Tabs, Button, Card, Space, message, Typography, Divider } from 'antd';
import {
  DashboardOutlined,
  LineChartOutlined,
  TeamOutlined,
  CarOutlined,
  RiseOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import InventoryTab from './components/InventoryTab';
import DemandTab from './components/DemandTab';
import SupplierTab from './components/SupplierTab';
import ShipmentTab from './components/ShipmentTab';
import ForecastTab from './components/ForecastTab';
import AIAssistantTab from './components/AIAssistantTab';
import { checkHealth, generateData } from './services/api';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function App() {
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setBackendStatus('checking');
    try {
      await checkHealth();
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  const handleGenerateData = async () => {
    setLoading(true);
    try {
      await generateData();
      message.success('Synthetic data generated successfully!');
    } catch (error) {
      message.error('Failed to generate data. Please check the backend.');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <DashboardOutlined /> Inventory
        </span>
      ),
      children: <InventoryTab />,
    },
    {
      key: '2',
      label: (
        <span>
          <LineChartOutlined /> Demand & Sales
        </span>
      ),
      children: <DemandTab />,
    },
    {
      key: '3',
      label: (
        <span>
          <TeamOutlined /> Suppliers
        </span>
      ),
      children: <SupplierTab />,
    },
    {
      key: '4',
      label: (
        <span>
          <CarOutlined /> Shipments
        </span>
      ),
      children: <ShipmentTab />,
    },
    {
      key: '5',
      label: (
        <span>
          <RiseOutlined /> Forecasting
        </span>
      ),
      children: <ForecastTab />,
    },
    {
      key: '6',
      label: (
        <span>
          <RobotOutlined /> AI Assistant
        </span>
      ),
      children: <AIAssistantTab />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DashboardOutlined style={{ fontSize: '28px', color: '#fff' }} />
          <div>
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              Retail SupplyChainIQ
            </Title>
            <Text style={{ color: '#e0e0e0', fontSize: '12px' }}>
              AI-powered retail supply chain analytics and forecasting platform
            </Text>
          </div>
        </div>
      </Header>

      <Layout>
        <Sider
          width={280}
          style={{
            background: '#fff',
            padding: '24px',
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
          }}
        >
          <Card
            title="System Controls"
            size="small"
            style={{ marginBottom: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                block
                loading={loading}
                onClick={handleGenerateData}
                icon={<SyncOutlined />}
              >
                Generate Data
              </Button>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Generate 5000 rows × 4 tables
              </Text>
            </Space>
          </Card>

          <Divider style={{ margin: '16px 0' }} />

          <Card
            title="Backend Status"
            size="small"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {backendStatus === 'connected' && (
                <>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                    <Text strong style={{ color: '#52c41a' }}>Connected</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Backend is reachable
                  </Text>
                </>
              )}
              {backendStatus === 'disconnected' && (
                <>
                  <Space>
                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
                    <Text strong style={{ color: '#ff4d4f' }}>Disconnected</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Please start FastAPI backend
                  </Text>
                </>
              )}
              {backendStatus === 'checking' && (
                <>
                  <Space>
                    <SyncOutlined spin style={{ fontSize: '18px' }} />
                    <Text>Checking...</Text>
                  </Space>
                </>
              )}
              <Button size="small" block onClick={checkBackendHealth}>
                Refresh Status
              </Button>
            </Space>
          </Card>
        </Sider>

        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
            }}
          >
            <Tabs
              defaultActiveKey="1"
              items={tabItems}
              size="large"
              tabBarStyle={{ marginBottom: '24px' }}
            />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
