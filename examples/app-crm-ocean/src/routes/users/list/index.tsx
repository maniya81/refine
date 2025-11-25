import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Tag,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useList, useCustomMutation } from "@refinedev/core";
import type { ColumnsType } from "antd/es/table";
import { getOrgId } from "@/utilities/organization";
import type { User, Role, CreateUserPayload } from "@/interfaces/user-admin";

const { Title, Text } = Typography;

export const UserListPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Fetch users using useList - same pattern as leads
  const usersQuery = useList<User>({
    resource: "user",
  });

  // Fetch roles using useList
  const rolesQuery = useList<Role>({
    resource: "role",
  });

  // Create user mutation
  const { mutate: createUser, mutation: createMutation } = useCustomMutation();
  const creating = createMutation.isPending;

  // Update user mutation
  const { mutate: updateUser, mutation: updateMutation } = useCustomMutation();
  const updating = updateMutation.isPending;

  // Check email exists mutation
  const { mutate: checkEmailExists } = useCustomMutation();

  // Extract data from useList result - it returns { query, result }
  // result contains { data: [], total: number }
  const users: User[] = usersQuery.result?.data || [];
  const roles: Role[] = rolesQuery.result?.data || [];
  const usersLoading = usersQuery.query.isLoading || false;
  const rolesLoading = rolesQuery.query.isLoading || false;

  // Helper function to extract error message from API response
  const extractErrorMessage = (error: any): string | null => {
    return (
      error?.response?.data?.detail?.message || error?.detail?.message || null
    );
  };

  // Helper function to show email error
  const showEmailError = (errorMsg: string) => {
    createForm.setFields([
      {
        name: "email",
        errors: [errorMsg],
      },
    ]);
    message.error(errorMsg);
  };

  // Validate email existence
  const validateEmailExists = (email: string, onEmailAvailable: () => void) => {
    setCheckingEmail(true);
    checkEmailExists(
      {
        url: `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/v1/user/exists`,
        method: "post",
        values: { email },
        meta: {
          headers: {
            "x-org-id": getOrgId(),
          },
        },
      },
      {
        onSuccess: (data: any) => {
          // If response has message or user_id, email exists
          const detail = data?.data?.detail;
          if (detail?.message || detail?.user_id) {
            showEmailError(
              detail.message || "This email is already registered",
            );
            setCheckingEmail(false);
            return;
          }
          // Email doesn't exist, continue
          onEmailAvailable();
        },
        onError: (error: any) => {
          // Error with detail.message means email exists
          const errorMsg = extractErrorMessage(error);
          if (errorMsg) {
            showEmailError(errorMsg);
            setCheckingEmail(false);
            return;
          }
          // No error message means email is available
          onEmailAvailable();
        },
      },
    );
  };

  // Check if email already exists on blur
  const handleEmailBlur = async () => {
    const email = createForm.getFieldValue("email");
    if (!email) return;

    validateEmailExists(email, () => {
      setCheckingEmail(false);
    });
  };

  // Handle form submission - first check if email exists, then create
  const handleCreateUser = async (values: CreateUserPayload) => {
    // Prepend +91 to mobile number
    const payload = {
      ...values,
      mobile: `+91${values.mobile}`,
    };

    validateEmailExists(values.email, () =>
      createUser(
        {
          url: `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/v1/user/`,
          method: "post",
          values: payload,
          meta: {
            headers: {
              "x-org-id": getOrgId(),
            },
          },
        },
        {
          onSuccess: () => {
            message.success("User created successfully!");
            setIsCreateModalOpen(false);
            createForm.resetFields();
            usersQuery.query.refetch();
            setCheckingEmail(false);
          },
          onError: (error: any) => {
            const errorDetail = error?.response?.data?.detail || error?.detail;
            const errorMessage = error?.message;

            let finalErrorMessage = "Failed to create user";

            if (errorDetail?.message) {
              finalErrorMessage = errorDetail.message;
            } else if (errorMessage?.message) {
              finalErrorMessage = errorMessage.message;
            } else if (typeof errorDetail === "string") {
              finalErrorMessage = errorDetail;
            } else if (typeof errorMessage === "string") {
              finalErrorMessage = errorMessage;
            }

            if (finalErrorMessage.toLowerCase().includes("already exists")) {
              showEmailError(finalErrorMessage);
            } else {
              message.error(finalErrorMessage);
            }

            setCheckingEmail(false);
          },
        },
      ),
    );
  };

  // Handle edit user
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    // Find the role_id from the role_name
    const userRole = roles.find((r) => r.name === user.role_name);
    editForm.setFieldsValue({
      role_id: userRole?.id,
    });
    setIsEditModalOpen(true);
  };

  // Handle update user
  const handleUpdateUser = async (values: { role_id: string }) => {
    if (!editingUser) return;

    updateUser(
      {
        url: `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/v1/user/${editingUser.id}`,
        method: "put",
        values: { role_id: values.role_id },
        meta: {
          headers: {
            "x-org-id": getOrgId(),
          },
        },
      },
      {
        onSuccess: () => {
          message.success("User role updated successfully!");
          setIsEditModalOpen(false);
          setEditingUser(null);
          editForm.resetFields();
          usersQuery.query.refetch();
        },
        onError: (error: any) => {
          const errorDetail = error?.response?.data?.detail || error?.detail;
          const errorMessage = error?.message;

          const finalErrorMessage =
            errorDetail?.message ||
            errorMessage?.message ||
            (typeof errorDetail === "string" ? errorDetail : null) ||
            (typeof errorMessage === "string" ? errorMessage : null) ||
            "Failed to update user";

          message.error(finalErrorMessage);
        },
      },
    );
  };

  // Table columns
  const columns: ColumnsType<User> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <UserOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => (
        <Space>
          <MailOutlined style={{ color: "#52c41a" }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      key: "mobile",
      render: (text) =>
        text ? (
          <Space>
            <PhoneOutlined />
            <Text>{text}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Role",
      dataIndex: "role_name",
      key: "role_name",
      render: (text) => {
        const isAdmin = text === "admin";
        return (
          <Tag icon={<SafetyOutlined />} color={isAdmin ? "red" : "blue"}>
            {text?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEditClick(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <Space>
            <UserOutlined style={{ fontSize: "20px" }} />
            <Title level={4} style={{ margin: 0 }}>
              Users
            </Title>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create User
          </Button>
        }
      >
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={usersLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>Create New User</span>
          </Space>
        }
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateUser}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please enter name" },
              { min: 2, message: "Name must be at least 2 characters" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter full name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="user@example.com"
              size="large"
              onBlur={handleEmailBlur}
              disabled={checkingEmail}
            />
          </Form.Item>

          <Form.Item
            name="mobile"
            label="Mobile"
            rules={[
              { required: true, message: "Please enter mobile number" },
              {
                pattern: /^\d{10}$/,
                message: "Please enter exactly 10 digits",
              },
            ]}
          >
            <Input
              addonBefore="+91"
              prefix={<PhoneOutlined />}
              placeholder="1234567890"
              size="large"
              maxLength={10}
              onKeyPress={(e) => {
                // Only allow numbers
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter password" size="large" />
          </Form.Item>

          <Form.Item
            name="role_id"
            label="Role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select
              placeholder="Select user role"
              size="large"
              loading={rolesLoading}
              options={roles.map((role: Role) => ({
                label: (
                  <Space>
                    <SafetyOutlined />
                    {role.name.toUpperCase()}
                    {role.is_default && <Tag color="blue">Default</Tag>}
                  </Space>
                ),
                value: role.id,
              }))}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  createForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating || checkingEmail}
                icon={<PlusOutlined />}
              >
                Create User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>Edit User Role</span>
          </Space>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        {editingUser && (
          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="small">
              <Text strong>User Information:</Text>
              <Text>
                <UserOutlined style={{ marginRight: 8 }} />
                {editingUser.name}
              </Text>
              <Text type="secondary">
                <MailOutlined style={{ marginRight: 8 }} />
                {editingUser.email}
              </Text>
            </Space>
          </div>
        )}
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="role_id"
            label="Role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select
              placeholder="Select user role"
              size="large"
              loading={rolesLoading}
              options={roles.map((role: Role) => ({
                label: (
                  <Space>
                    <SafetyOutlined />
                    {role.name.toUpperCase()}
                    {role.is_default && <Tag color="blue">Default</Tag>}
                  </Space>
                ),
                value: role.id,
              }))}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUser(null);
                  editForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updating}
                icon={<EditOutlined />}
              >
                Update Role
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
