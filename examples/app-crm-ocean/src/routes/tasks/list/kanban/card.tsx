import { memo, useMemo } from "react";

import { useDelete } from "@refinedev/core";

import {
  CalendarOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  ContactsOutlined,
  PlayCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Button,
  Card,
  ConfigProvider,
  Dropdown,
  Skeleton,
  Space,
  Tag,
  theme,
  Tooltip,
} from "antd";
import dayjs from "dayjs";

import { CustomAvatar, Text, TextIcon } from "@/components";
import type { User } from "@/graphql/schema.types";
import { getDateColor } from "@/utilities";

type ProjectCardProps = {
  id: string;
  title: string;
  contactPerson?: string;
  updatedAt: string;
  dueDate?: string;
  users?: {
    id: string;
    name: string;
    avatarUrl?: User["avatarUrl"];
  }[];
  onCardClick?: () => void;

  /**
   * Called when a dropdown action is clicked. `tab` indicates which tab to open.
   * Expected values: "activities" | "appointments" | "contacts".
   */
  onViewClick?: (tab: "activities" | "appointments" | "contacts") => void;
  onSuccess?: () => void;
};

export const ProjectCard = ({
  id,
  title,
  contactPerson,
  dueDate,
  users,
  onCardClick,
  onViewClick,
  onSuccess,
}: ProjectCardProps) => {
  const { token } = theme.useToken();
  const { mutate } = useDelete();

  const dropdownItems = useMemo(() => {
    const items: MenuProps["items"] = [
      {
        key: "activity",
        icon: <ClockCircleOutlined />,
        label: "Log Activity",
        onClick: (e) => {
          // stop dropdown/card click propagation
          e.domEvent?.stopPropagation();
          if (onViewClick) onViewClick("activities");
        },
      },
      {
        key: "appointments",
        icon: <CalendarOutlined />,
        label: "Log Appointments",
        onClick: (e) => {
          e.domEvent?.stopPropagation();
          if (onViewClick) onViewClick("appointments");
        },
      },
      {
        key: "contacts",
        icon: <ContactsOutlined />,
        label: "Add Contacts",
        onClick: (e) => {
          e.domEvent?.stopPropagation();
          if (onViewClick) onViewClick("contacts");
        },
      },
      // {
      //   type: "divider",
      //   key: "divider-1",
      // },
      // {
      //   danger: true,
      //   label: "Delete card",
      //   key: "delete",
      //   icon: <DeleteOutlined />,
      //   onClick: (e) => {
      //     e?.domEvent?.stopPropagation();
      //     Modal.confirm({
      //       title: "Delete Lead",
      //       content: "Are you sure you want to delete this lead?",
      //       okText: "Delete",
      //       cancelText: "Cancel",
      //       okType: "danger",
      //       onOk: () => {
      //         mutate({
      //           resource: "lead",
      //           id,
      //         });
      //       },
      //     });
      //   },
      // },
    ];

    return items;
  }, [id, onViewClick, mutate]);

  const dueDateOptions = useMemo(() => {
    if (!dueDate) return null;
    const date = dayjs(dueDate);
    return {
      color: getDateColor({ date: dueDate }) as string,
      text: date.format("MMM D"),
    };
  }, [dueDate]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Tag: {
            colorText: token.colorTextSecondary,
          },
          Card: {
            headerBg: "transparent",
          },
        },
      }}
    >
      <Card
        size="small"
        title={
          <div style={{ lineHeight: 1.4 }}>
            <Text
              ellipsis={{ tooltip: title }}
              strong
              style={{
                display: "block",
                fontSize: "14px",
                marginBottom: "4px",
                color: token.colorText,
              }}
            >
              {title}
            </Text>
            {contactPerson && (
              <Text
                ellipsis={{ tooltip: contactPerson }}
                type="secondary"
                style={{
                  display: "block",
                  fontSize: "12px",
                  lineHeight: "16px",
                  color: token.colorTextSecondary,
                }}
              >
                {contactPerson}
              </Text>
            )}
          </div>
        }
        onClick={() => {
          if (onCardClick) {
            onCardClick();
          }
        }}
        extra={
          <Dropdown
            trigger={["click"]}
            menu={{ items: dropdownItems }}
            placement="bottom"
            arrow={{ pointAtCenter: true }}
          >
            <Button
              type="text"
              shape="default"
              size="small"
              icon={<MoreOutlined />}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            />
          </Dropdown>
        }
        styles={{
          header: {
            padding: "12px 16px 8px 16px",
            minHeight: "auto",
          },
          body: {
            padding: "8px 16px 12px 16px",
          },
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <TextIcon
            style={{
              marginRight: "4px",
            }}
          />
          {dueDateOptions && (
            <Tag
              icon={
                <ClockCircleOutlined
                  style={{
                    fontSize: "12px",
                  }}
                />
              }
              style={{
                padding: "0 4px",
                marginInlineEnd: "0",
                backgroundColor:
                  dueDateOptions.color === "default" ? "transparent" : "unset",
              }}
              color={dueDateOptions.color}
              bordered={dueDateOptions.color !== "default"}
            >
              {dueDateOptions.text}
            </Tag>
          )}
          {!!users?.length && (
            <Space
              size={4}
              wrap
              direction="horizontal"
              align="center"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginLeft: "auto",
                marginRight: "0",
              }}
            >
              {users.map((user) => {
                return (
                  <Tooltip key={user.id} title={user.name}>
                    <CustomAvatar name={user.name} src={user.avatarUrl} />
                  </Tooltip>
                );
              })}
            </Space>
          )}
        </div>
      </Card>
    </ConfigProvider>
  );
};

export const ProjectCardSkeleton = () => {
  return (
    <Card
      size="small"
      bodyStyle={{
        display: "flex",
        justifyContent: "center",
        gap: "8px",
      }}
      title={
        <Skeleton.Button
          active
          size="small"
          style={{
            width: "200px",
            height: "22px",
          }}
        />
      }
    >
      <Skeleton.Button
        active
        size="small"
        style={{
          width: "200px",
        }}
      />
      <Skeleton.Avatar active size="small" />
    </Card>
  );
};

export const ProjectCardMemo = memo(ProjectCard, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.title === next.title &&
    prev.contactPerson === next.contactPerson &&
    prev.dueDate === next.dueDate &&
    prev.users?.length === next.users?.length &&
    prev.updatedAt === next.updatedAt &&
    prev.onCardClick === next.onCardClick &&
    prev.onViewClick === next.onViewClick &&
    prev.onSuccess === next.onSuccess
  );
});
