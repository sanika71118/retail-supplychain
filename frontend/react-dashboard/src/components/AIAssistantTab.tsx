import { useState } from 'react';
import { Card, Input, Button, Typography, Space, Alert, Spin } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';
import { queryRAG } from '../services/api';
import type { RAGResponse } from '../types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const AIAssistantTab = () => {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await queryRAG(query);
      setResponse(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get response. Please try again.');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div>
      <Title level={4}>
        <RobotOutlined /> AI Supply Chain Analyst
      </Title>

      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>Ask a question about your supply chain:</Text>
            <TextArea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., What are the top risks in my inventory? Which suppliers have the highest defect rates?"
              rows={4}
              style={{ marginTop: '8px' }}
            />
          </div>

          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!query.trim()}
          >
            Ask Question
          </Button>
        </Space>
      </Card>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Analyzing your question..." />
        </div>
      )}

      {!loading && response && (
        <>
          <Card
            title="AI Analysis"
            style={{ marginBottom: '24px' }}
            headStyle={{ background: '#f0f5ff', fontWeight: 600 }}
          >
            <Paragraph style={{ fontSize: '16px', lineHeight: '1.8' }}>
              {response.answer}
            </Paragraph>
          </Card>

          {response.retrieved_context && response.retrieved_context.length > 0 && (
            <Card
              title="Retrieved Context"
              size="small"
              style={{ background: '#fafafa' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {response.retrieved_context.map((context, index) => (
                  <Card
                    key={index}
                    size="small"
                    type="inner"
                    title={`Context ${index + 1}`}
                  >
                    <Text style={{ fontSize: '13px' }}>{context}</Text>
                  </Card>
                ))}
              </Space>
            </Card>
          )}
        </>
      )}

      {!loading && !response && !error && (
        <Alert
          message="Ready to assist!"
          description="Enter your business question above and click 'Ask Question' to get AI-powered insights about your supply chain."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default AIAssistantTab;
