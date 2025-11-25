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
  SafetyOutlined,
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useList, useCustomMutation } from "@refinedev/core";
import type { ColumnsType } from "antd/es/table";
import { getOrgId } from "@/utilities/organization";
import type {
  Role,
  Permission,
  CreateRolePayload,
  UpdateRolePayload,
} from "@/interfaces/role";

const { Title, Text } = Typography;

export const RoleListPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Fetch roles using useList
  const rolesQuery = useList<Role>({
    resource: "role",
  });

  // Fetch permissions using useList
  const permissionsQuery = useList<Permission>({
    resource: "permission",
    pagination: {
      mode: "off", // Fetch all permissions
    },
  });

  // Create role mutation
  const { mutate: createRole, mutation: createMutation } = useCustomMutation();
  const creating = createMutation.isPending;

  // Update role mutation
  const { mutate: updateRole, mutation: updateMutation } = useCustomMutation();
  const updating = updateMutation.isPending;

  // Delete role mutation
  const { mutate: deleteRole } = useCustomMutation();

  // Extract data from useList result
  const roles: Role[] = rolesQuery.result?.data || [];
  const permissions: Permission[] = permissionsQuery.result?.data || [];
  const rolesLoading = rolesQuery.query.isLoading || false;
  const permissionsLoading = permissionsQuery.query.isLoading || false;

  // Handle create role
  const handleCreateRole = async (values: CreateRolePayload) => {
    createRole(
      {
        url: `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/v1/role/`,
        method: "post",
        values,
      },
      {
        onSuccess: () => {
          message.success("Role created successfully!");
          setIsCreateModalOpen(false);
          createForm.resetFields();
          rolesQuery.query.refetch();
        },
        onError: (error: any) => {
          const errorDetail = error?.response?.data?.detail || error?.detail;
          const errorMessage = error?.message;

          const finalErrorMessage =
            errorDetail?.message ||
            errorMessage?.message ||
            (typeof errorDetail === "string" ? errorDetail : null) ||
            (typeof errorMessage === "string" ? errorMessage : null) ||
            "Failed to create role";

          message.error(finalErrorMessage);
        },
      },
    );
  };

  // Handle edit role
  const handleEditClick = (role: Role) => {
    // Prevent editing of default roles
    if (role.is_default) {
      Modal.warning({
        title: "Cannot Edit Default Role",
        content: `The role "${role.name.toUpperCase()}" is a default role and cannot be edited.`,
        okText: "OK",
      });
      return;
    }

    setEditingRole(role);
    // Extract permission IDs from the role's permissions array
    const permissionIds = role.permissions?.map((p) => p.id) || [];
    editForm.setFieldsValue({
      description: role.description,
      permission_ids: permissionIds,
    });
    setIsEditModalOpen(true);
  };

  // Handle update role
  const handleUpdateRole = async (values: UpdateRolePayload) => {
    if (!editingRole) return;

    updateRole(
      {
        url: `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/v1/role/${editingRole.id}`,
        method: "put",
        values,
      },
      {
        onSuccess: () => {
          message.success("Role updated successfully!");
          setIsEditModalOpen(false);
          setEditingRole(null);
          editForm.resetFields();
          rolesQuery.query.refetch();
        },
        onError: (error: any) => {
          const errorDetail = error?.response?.data?.detail || error?.detail;
          const errorMessage = error?.message;

          const finalErrorMessage =
            errorDetail?.message ||
            errorMessage?.message ||
            (typeof errorDetail === "string" ? errorDetail : null) ||
            (typeof errorMessage === "string" ? errorMessage : null) ||
            "Failed to update role";

          message.error(finalErrorMessage);
        },
      },
    );
  };

  // Handle delete role
  const handleDeleteRole = (
    roleId: string,
    roleName: string,
    isDefault: boolean,
  ) => {
    // Prevent deletion of default roles
    if (isDefault) {
      Modal.warning({
        title: "Cannot Delete Default Role",
        content: `The role "${roleName.toUpperCase()}" is a default role and cannot be deleted.`,
        okText: "OK",
      });
      return;
    }

    Modal.confirm({
      title: "Delete Role",
      content: `Are you sure you want to delete the role "${roleName.toUpperCase()}"?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        deleteRole(
          {
            url: `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/v1/role/${roleId}`,
            method: "delete",
            values: {},
          },
          {
            onSuccess: () => {
              message.success("Role deleted successfully!");
              rolesQuery.query.refetch();
            },
            onError: (error: any) => {
              const errorDetail =
                error?.response?.data?.detail || error?.detail;
              const errorMessage = error?.message;

              const finalErrorMessage =
                errorDetail?.message ||
                errorMessage?.message ||
                (typeof errorDetail === "string" ? errorDetail : null) ||
                (typeof errorMessage === "string" ? errorMessage : null) ||
                "Failed to delete role";

              message.error(finalErrorMessage);
            },
          },
        );
      },
    });
  };

  // Table columns
  const columns: ColumnsType<Role> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <SafetyOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text.toUpperCase()}</Text>
          {record.is_default && (
            <Tag icon={<CheckCircleOutlined />} color="blue">
              Default
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) =>
        text ? <Text>{text}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              handleDeleteRole(record.id, record.name, record.is_default)
            }
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <Space>
            <SafetyOutlined style={{ fontSize: "20px" }} />
            <Title level={4} style={{ margin: 0 }}>
              Roles
            </Title>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Role
          </Button>
        }
      >
        <Table
          dataSource={roles}
          columns={columns}
          rowKey="id"
          loading={rolesLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} roles`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
        />
      </Card>

      {/* Create Role Modal */}
      <Modal
        title={
          <Space>
            <SafetyOutlined />
            <span>Create New Role</span>
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
          onFinish={handleCreateRole}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[
              { required: true, message: "Please enter role name" },
              { min: 2, message: "Role name must be at least 2 characters" },
            ]}
          >
            <Input
              prefix={<SafetyOutlined />}
              placeholder="Enter role name (e.g., manager, sales)"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter description" },
              { min: 5, message: "Description must be at least 5 characters" },
            ]}
          >
            <Input.TextArea
              placeholder="Describe the role and its responsibilities"
              rows={3}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="permission_ids"
            label="Permissions"
            rules={[
              {
                required: true,
                message: "Please select at least one permission",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select permissions"
              size="large"
              loading={permissionsLoading}
              options={permissions.map((permission) => ({
                label: permission.name.replace(/_/g, " ").toUpperCase(),
                value: permission.id,
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
                loading={creating}
                icon={<PlusOutlined />}
              >
                Create Role
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>Edit Role</span>
          </Space>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingRole(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {editingRole && (
          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="small">
              <Text strong>Role Information:</Text>
              <Text>
                <SafetyOutlined style={{ marginRight: 8 }} />
                {editingRole.name.toUpperCase()}
              </Text>
              {editingRole.is_default && (
                <Tag color="blue" icon={<CheckCircleOutlined />}>
                  Default Role
                </Tag>
              )}
            </Space>
          </div>
        )}
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateRole}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter description" },
              { min: 5, message: "Description must be at least 5 characters" },
            ]}
          >
            <Input.TextArea
              placeholder="Describe the role and its responsibilities"
              rows={3}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="permission_ids"
            label="Permissions"
            rules={[
              {
                required: true,
                message: "Please select at least one permission",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select permissions"
              size="large"
              loading={permissionsLoading}
              options={permissions.map((permission) => ({
                label: permission.name.replace(/_/g, " ").toUpperCase(),
                value: permission.id,
              }))}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRole(null);
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
