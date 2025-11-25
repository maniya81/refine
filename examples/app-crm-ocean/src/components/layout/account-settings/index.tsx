import { useEffect } from "react";
import { useLogout, useGetIdentity } from "@refinedev/core";

import { CloseOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Drawer, Form, Input, Spin, message, Avatar } from "antd";

import { getNameInitials } from "@/utilities";

import { CustomAvatar } from "../../custom-avatar";
import { Text } from "../../text";

type Props = {
  opened: boolean;
  setOpened: (opened: boolean) => void;
  userId: string;
};

export const AccountSettings = ({ opened, setOpened, userId }: Props) => {
  const [form] = Form.useForm();
  const { mutate: logout } = useLogout();

  // Use Refine's identity hook to fetch logged user data
  // Enable query only when drawer is opened to avoid redundant calls
  const {
    data: userData,
    isLoading,
    refetch,
  } = useGetIdentity<{
    id: number;
    name: string;
    email: string;
    mobile?: string;
    avatarUrl?: string;
  }>({
    queryOptions: {
      enabled: opened, // Only fetch when drawer is opened
    },
  });

  useEffect(() => {
    // Update form when user data is loaded
    if (userData && opened) {
      form.setFieldsValue({
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
      });
    }
  }, [userData, form, opened]);

  const closeModal = () => {
    setOpened(false);
  };

  if (!opened) {
    return null;
  }

  if (isLoading) {
    return (
      <Drawer
        open={opened}
        width={756}
        styles={{
          body: {
            background: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <Spin />
      </Drawer>
    );
  }

  return (
    <Drawer
      onClose={closeModal}
      open={opened}
      width={756}
      styles={{
        body: { background: "#f5f5f5", padding: 0 },
        header: { display: "none" },
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          backgroundColor: "#fff",
        }}
      >
        <Text strong> Account Settings </Text>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => closeModal()}
        />
      </div>
      <div
        style={{
          padding: "16px",
        }}
      >
        <Card>
          {userData?.avatarUrl ? (
            <Avatar
              size={96}
              src={userData.avatarUrl}
              style={{
                marginBottom: "24px",
              }}
            />
          ) : (
            <CustomAvatar
              name={userData?.name || userData?.email || "User"}
              size={96}
              style={{
                marginBottom: "24px",
                fontSize: "48px",
              }}
            />
          )}
          <Form form={form} layout="vertical">
            <Form.Item label="Name" name="name">
              <Input placeholder="Name" disabled />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input placeholder="Email" disabled />
            </Form.Item>
            <Form.Item label="Mobile" name="mobile">
              <Input placeholder="Mobile" disabled />
            </Form.Item>
          </Form>
        </Card>
      </div>
    </Drawer>
  );
};
