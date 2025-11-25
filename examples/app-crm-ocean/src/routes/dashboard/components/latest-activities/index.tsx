import {
  UnorderedListOutlined,
  PhoneOutlined,
  TeamOutlined,
  MailOutlined,
  MessageOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Card, List, Skeleton as AntdSkeleton, Space, Tag } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { CustomAvatar, Text } from "@/components";
import { useLatestInteractions } from "@/services/interaction.service";

dayjs.extend(relativeTime);

// Icon and color mapping for interaction types
const interactionConfig: Record<
  string,
  { icon: React.ReactNode; color: string; text: string }
> = {
  Call: {
    icon: <PhoneOutlined />,
    color: "#1890ff",
    text: "called",
  },
  Meeting: {
    icon: <TeamOutlined />,
    color: "#52c41a",
    text: "met with",
  },
  Email: {
    icon: <MailOutlined />,
    color: "#722ed1",
    text: "emailed",
  },
  Message: {
    icon: <MessageOutlined />,
    color: "#fa8c16",
    text: "messaged",
  },
  Other: {
    icon: <FileTextOutlined />,
    color: "#8c8c8c",
    text: "interacted with",
  },
};

type Props = { limit?: number };

function getInteractionWith(item: any): string {
  const b = item?.business ?? {};

  const businessName = b.business?.trim() ?? "";
  const title = b.title?.trim() ?? "";
  const name = b.name?.trim() ?? "";

  if (businessName) {
    // 1. Prefer business name
    return businessName;
  }

  if (title) {
    // 2. title + name
    return `${title} ${name}`.trim();
  }

  // 3. name fallback
  return name;
}

export const DashboardLatestActivities = ({ limit = 5 }: Props) => {
  const { data: interactions = [], isLoading } = useLatestInteractions(limit);

  return (
    <Card
      headStyle={{ padding: "16px" }}
      bodyStyle={{
        padding: "0 1rem",
      }}
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <UnorderedListOutlined />
          <Text size="sm" style={{ marginLeft: ".5rem" }}>
            Latest Interactions
          </Text>
        </div>
      }
    >
      {isLoading ? (
        <List
          itemLayout="horizontal"
          dataSource={Array.from({ length: limit }).map((_, index) => ({
            id: index,
          }))}
          renderItem={(_item, index) => {
            return (
              <List.Item key={index}>
                <List.Item.Meta
                  avatar={
                    <AntdSkeleton.Avatar
                      active
                      size={48}
                      shape="square"
                      style={{
                        borderRadius: "4px",
                      }}
                    />
                  }
                  title={
                    <AntdSkeleton.Button
                      active
                      style={{
                        height: "16px",
                      }}
                    />
                  }
                  description={
                    <AntdSkeleton.Button
                      active
                      style={{
                        width: "300px",
                        height: "16px",
                      }}
                    />
                  }
                />
              </List.Item>
            );
          }}
        />
      ) : interactions.length === 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
            color: "#8c8c8c",
          }}
        >
          <Space direction="vertical" align="center">
            <UnorderedListOutlined style={{ fontSize: "48px", opacity: 0.3 }} />
            <Text type="secondary">No interactions yet</Text>
          </Space>
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={interactions}
          renderItem={(item) => {
            const config =
              interactionConfig[item.interaction_type] ||
              interactionConfig.Other;
            const timeAgo = dayjs(item.interacted_at).fromNow();
            const fullDate = dayjs(item.interacted_at).format(
              "MMM DD, YYYY - HH:mm",
            );
            const interactedWith = getInteractionWith(item);

            return (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <CustomAvatar
                      shape="square"
                      size={48}
                      name={item.interaction_type}
                      style={{
                        backgroundColor: config.color,
                      }}
                    />
                  }
                  title={
                    <Space size={4}>
                      <Text type="secondary" size="xs">
                        {fullDate}
                      </Text>
                      <Text type="secondary" size="xs">
                        •
                      </Text>
                      <Text type="secondary" size="xs">
                        {timeAgo}
                      </Text>
                    </Space>
                  }
                  description={
                    <Space
                      direction="vertical"
                      size={4}
                      style={{ width: "100%" }}
                    >
                      <Space size={4} wrap>
                        <Text strong>{item.interacted_by_user.name}</Text>
                        <Text>{config.text}</Text>
                        <Text strong>{interactedWith}</Text>
                      </Space>
                      <Text
                        ellipsis={{ tooltip: true }}
                        style={{ color: "#595959" }}
                      >
                        {item.note || "No notes added"}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
};
