import {
  CalendarOutlined,
  ClockCircleOutlined,
  ContactsOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, type MenuProps } from "antd";

interface LeadLogButtonProps {
  leadId: string;
  onSuccess?: () => void;
  onViewClick?: (
    tab: "activities" | "appointments" | "contacts" | string,
  ) => void;
}

export const LeadLogButton: React.FC<LeadLogButtonProps> = ({
  leadId,
  onSuccess,
  onViewClick,
}) => {
  // Dropdown menu items and click handler
  const menuItems: MenuProps["items"] = [
    { key: "activity", label: "Activity", icon: <ClockCircleOutlined /> },
    { key: "appointment", label: "Appointments", icon: <CalendarOutlined /> },
    { key: "contacts", label: "Contacts", icon: <ContactsOutlined /> },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (!onViewClick) {
      console.warn("LeadLogButton: onViewClick callback not provided");
      return;
    }

    const tabMap: Record<string, string> = {
      activity: "activities",
      appointment: "appointments",
      contacts: "contacts",
    };

    const tab = tabMap[key];
    if (tab) {
      console.log(`LeadLogButton: Opening modal with tab: ${tab}`);
      onViewClick(tab);
    }
  };

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      trigger={["click"]}
    >
      <Button size="small">
        Log <DownOutlined />
      </Button>
    </Dropdown>
  );
};
