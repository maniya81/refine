import type { IResourceItem } from "@refinedev/core";

import {
  DashboardOutlined,
  CalendarOutlined,
  ProjectOutlined,
  ShopOutlined,
  TeamOutlined,
  RocketOutlined,
  FacebookOutlined,
  SettingOutlined,
  UserOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

export const resources: IResourceItem[] = [
  {
    name: "dashboard",
    list: "/app/dashboard",
    meta: {
      label: "Dashboard",
      icon: <DashboardOutlined />,
    },
  },
  {
    name: "calendar",
    list: "/app/calendar",
    meta: {
      label: "Calendar",
      icon: <CalendarOutlined />,
    },
  },
  {
    name: "lead",
    list: "/app/leads",
    create: "/app/leads/new",
    edit: "/app/leads/edit/:id",
    meta: {
      label: "Leads",
      icon: <RocketOutlined />,
    },
  },
  {
    name: "tasks",
    list: "/app/tasks",
    create: "/app/tasks/new",
    edit: "/app/tasks/edit/:id",
    meta: {
      label: "Tasks",
      icon: <ProjectOutlined />,
    },
  },
  {
    name: "facebook",
    list: "/app/facebook",
    meta: {
      label: "Facebook",
      icon: <FacebookOutlined />,
    },
  },
  {
    name: "administration",
    meta: {
      label: "Administration",
      icon: <SettingOutlined />,
    },
  },
  {
    name: "users",
    list: "/app/administration/users",
    meta: {
      label: "Users",
      icon: <UserOutlined />,
      parent: "administration",
    },
  },
  {
    name: "roles",
    list: "/app/administration/roles",
    meta: {
      label: "Roles",
      icon: <SafetyOutlined />,
      parent: "administration",
    },
  },
  // Meta resources (not displayed in menu, but available for data hooks)
  {
    name: "user",
    meta: {
      hide: true, // Hide from menu
    },
  },
  {
    name: "role",
    meta: {
      hide: true, // Hide from menu
    },
  },
  {
    name: "permission",
    meta: {
      hide: true, // Hide from menu
    },
  },
  {
    name: "interaction",
    meta: {
      hide: true, // Hide from menu
    },
  },
  {
    name: "appointment",
    meta: {
      hide: true, // Hide from menu
    },
  },
  {
    name: "contact",
    meta: {
      hide: true, // Hide from menu
    },
  },
];
