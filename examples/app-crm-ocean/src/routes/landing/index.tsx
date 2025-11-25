import { Button, Card, Col, Row, Space, Typography } from "antd";
import {
  CalendarOutlined,
  TeamOutlined,
  DashboardOutlined,
  BarChartOutlined,
  FacebookOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";

const { Title, Paragraph, Text } = Typography;

export const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: (
        <DashboardOutlined style={{ fontSize: "32px", color: "#1677FF" }} />
      ),
      title: "Powerful Dashboard",
      description:
        "Get real-time insights into your leads, appointments, and sales performance at a glance.",
    },
    {
      icon: <TeamOutlined style={{ fontSize: "32px", color: "#52C41A" }} />,
      title: "Lead Management",
      description:
        "Track and manage your leads efficiently from first contact to conversion.",
    },
    {
      icon: <CalendarOutlined style={{ fontSize: "32px", color: "#722ED1" }} />,
      title: "Appointment Scheduling",
      description:
        "Schedule and manage appointments with ease. Never miss an important meeting.",
    },
    {
      icon: <BarChartOutlined style={{ fontSize: "32px", color: "#FA8C16" }} />,
      title: "Analytics & Reports",
      description:
        "Make data-driven decisions with comprehensive analytics and reporting tools.",
    },
    {
      icon: <FacebookOutlined style={{ fontSize: "32px", color: "#1890FF" }} />,
      title: "Facebook Integration",
      description:
        "Seamlessly import leads from Facebook Lead Ads directly into your CRM.",
    },
    {
      icon: (
        <CheckCircleOutlined style={{ fontSize: "32px", color: "#13C2C2" }} />
      ),
      title: "Task Management",
      description:
        "Organize your work with intuitive task management and follow-up reminders.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          padding: "80px 24px",
          textAlign: "center",
          color: "white",
        }}
      >
        <Title
          level={1}
          style={{
            color: "white",
            fontSize: "48px",
            marginBottom: "24px",
            fontWeight: 700,
          }}
        >
          Welcome to OceanCRM
        </Title>
        <Paragraph
          style={{
            color: "white",
            fontSize: "20px",
            maxWidth: "700px",
            margin: "0 auto 40px",
            opacity: 0.95,
          }}
        >
          The complete customer relationship management solution designed to
          help your business grow. Manage leads, schedule appointments, and
          close more deals with ease.
        </Paragraph>
        <Space size="large">
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/login")}
            style={{
              height: "50px",
              fontSize: "18px",
              padding: "0 40px",
              backgroundColor: "#52C41A",
              borderColor: "#52C41A",
            }}
          >
            Sign In
          </Button>
          <Button
            size="large"
            onClick={() => navigate("/login")}
            style={{
              height: "50px",
              fontSize: "18px",
              padding: "0 40px",
              backgroundColor: "white",
              color: "#667eea",
              borderColor: "white",
            }}
          >
            Get Started
          </Button>
        </Space>
      </div>

      {/* Features Section */}
      <div
        style={{
          padding: "60px 24px",
          backgroundColor: "white",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Title
            level={2}
            style={{
              textAlign: "center",
              marginBottom: "16px",
              color: "#262626",
            }}
          >
            Everything You Need to Succeed
          </Title>
          <Paragraph
            style={{
              textAlign: "center",
              fontSize: "16px",
              marginBottom: "60px",
              color: "#595959",
            }}
          >
            Powerful features to streamline your sales process and grow your
            business
          </Paragraph>

          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card
                  hoverable
                  style={{
                    height: "100%",
                    textAlign: "center",
                    border: "1px solid #f0f0f0",
                    borderRadius: "8px",
                  }}
                  bodyStyle={{ padding: "32px" }}
                >
                  <div style={{ marginBottom: "16px" }}>{feature.icon}</div>
                  <Title level={4} style={{ marginBottom: "12px" }}>
                    {feature.title}
                  </Title>
                  <Text type="secondary" style={{ fontSize: "14px" }}>
                    {feature.description}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div
        style={{
          padding: "80px 24px",
          textAlign: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Title level={2} style={{ marginBottom: "24px", color: "#262626" }}>
          Ready to Transform Your Sales Process?
        </Title>
        <Paragraph
          style={{
            fontSize: "16px",
            marginBottom: "40px",
            color: "#595959",
            maxWidth: "600px",
            margin: "0 auto 40px",
          }}
        >
          Join thousands of businesses already using OceanCRM to manage their
          customer relationships and drive growth.
        </Paragraph>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate("/login")}
          style={{
            height: "50px",
            fontSize: "18px",
            padding: "0 50px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderColor: "transparent",
          }}
        >
          Get Started Today
        </Button>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          backgroundColor: "#001529",
          color: "white",
        }}
      >
        <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
          © 2025 OceanCRM by{" "}
          <a
            href="https://oceantechnolab.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1890ff", textDecoration: "none" }}
          >
            Ocean Technolab
          </a>
          . All rights reserved.
        </Text>
      </div>
    </div>
  );
};
