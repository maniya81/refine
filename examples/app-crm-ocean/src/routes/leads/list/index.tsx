import React, { useState } from "react";
import {
  DeleteButton,
  EditButton,
  List,
  useTable,
  useSelect,
} from "@refinedev/antd";
import {
  Input,
  Space,
  Table,
  Tag,
  Button,
  Select,
  Tooltip,
  DatePicker,
} from "antd";
import {
  EyeOutlined,
  FacebookOutlined,
  FilterOutlined,
  GlobalOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import { CustomAvatar } from "@/components/custom-avatar";
import { Text } from "@/components/text";
import { LeadLogButton } from "@/routes/leads/components/lead-log-button";
import { LeadFormModal } from "@/routes/leads/list/lead-form-modal";
import { LeadDetailModal } from "@/routes/leads";
import { MetaImportModal } from "@/components/meta-import-modal";
// import { useLocation, useNavigate } from "react-router-dom";

const { Search } = Input;
const { RangePicker } = DatePicker;

// Icon and color mapping for lead sources
const sourceIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  INSTAGRAM: { icon: <InstagramOutlined />, color: "#E1306C" },
  FACEBOOK: { icon: <FacebookOutlined />, color: "#1877F2" },
  LINKEDIN: { icon: <LinkedinOutlined />, color: "#0A66C2" },
  TWITTER: { icon: <TwitterOutlined />, color: "#1DA1F2" },
  WHATSAPP: { icon: <WhatsAppOutlined />, color: "#25D366" },
};

// Helper function to get source icon and color (safe lookup)
const getSourceIcon = (sourceName?: string) => {
  if (!sourceName) return { icon: <GlobalOutlined />, color: "#8c8c8c" };
  const upper = sourceName.toString().toUpperCase();
  return sourceIcons[upper] ?? { icon: <GlobalOutlined />, color: "#8c8c8c" };
};

const SOCIAL_MEDIA_SOURCES = new Set([
  "INSTAGRAM",
  "FACEBOOK",
  "LINKEDIN",
  "TWITTER",
]);

export const LeadListPage: React.FC = () => {
  // ==== State ====
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMetaImportModalOpen, setIsMetaImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadData, setSelectedLeadData] = useState<any>(null);
  const [initialTab, setInitialTab] = useState<string>("overview");
  const [editingLeadId, setEditingLeadId] = useState<string | undefined>();
  const [editingLeadData, setEditingLeadData] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<[any, any] | null>(null);

  // ==== Table & API ====
  const { tableProps, tableQuery } = useTable({
    resource: "lead",
    syncWithLocation: false,
    pagination: {
      mode: "off",
    },
    filters: {
      permanent: search
        ? [
            {
              field: "q",
              operator: "contains" as const,
              value: search,
            },
          ]
        : [],
    },
    meta: {
      select: "*",
    },
  });

  // users for assigned-to filter
  const { selectProps: userSelectProps } = useSelect({
    resource: "user",
    optionLabel: "name",
    optionValue: "id",
    pagination: {
      mode: "off", // This disables pagination completely
    },
  });

  const SOCIAL_OPTIONS = Object.entries(sourceIcons).map(
    ([key, { icon, color }]) => ({
      label: (
        <Space>
          <span style={{ color, fontSize: 16 }}>{icon}</span>
          {key}
        </Space>
      ),
      value: key,
    }),
  );

  const total = tableQuery?.data?.total || 0;

  const getTooltipContent = (record: any) => (
    <div style={{ lineHeight: "30px", width: "250px" }}>
      <div>
        <b>Business:</b> {record?.business?.business || record?.business?.name}
      </div>
      <div>
        <b>Contact:</b> {record?.business?.name}
      </div>
      <div>
        <b>Email:</b> {record?.business?.email}
      </div>
      <div>
        <b>Mobile:</b> {record?.business?.mobile}
      </div>
      <div>
        <b>Stage:</b> {record?.stage}
      </div>
      <div>
        <b>Potential:</b> ₹
        {record?.potential != null ? record.potential.toLocaleString() : "-"}
      </div>
      <div>
        <b>Product:</b> {record?.product?.name || "-"}
      </div>
      <div>
        <b>Source:</b> {record?.source?.name || "-"}
      </div>
    </div>
  );

  return (
    <>
      <List
        title="Leads"
        headerButtons={({ defaultButtons }) => (
          <>
            <Search
              placeholder="Search by business, email"
              onSearch={(value) => setSearch(value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button
              type="default"
              icon={<FacebookOutlined />}
              onClick={() => setIsMetaImportModalOpen(true)}
              style={{
                borderColor: "#1877F2",
                color: "#1877F2",
                marginLeft: 8,
              }}
            >
              Import
            </Button>
            {defaultButtons}
          </>
        )}
        createButtonProps={{
          onClick: () => {
            setIsCreateModalOpen(true);
          },
        }}
      >
        {tableQuery?.isLoading && <div>Loading leads...</div>}
        {tableQuery?.error && (
          <div style={{ color: "red", padding: "16px" }}>
            Error loading leads: {String(tableQuery.error)}
          </div>
        )}

        <Table
          {...tableProps}
          rowKey="id"
          pagination={{
            ...tableProps.pagination,
            showTotal: (total: number) => `${total} leads in total`,
            showSizeChanger: true,
            pageSizeOptions: ["50", "100", "500", "1000"],
          }}
        >
          <Table.Column
            dataIndex="business"
            title="Business"
            width={250}
            render={(business: any, record: any) => (
              <Tooltip placement="top" title={getTooltipContent(record)}>
                <Space style={{ cursor: "pointer" }}>
                  <div style={{ maxWidth: 140 }}>
                    <Text ellipsis={{ tooltip: true }}>
                      {business?.business || business?.name}
                    </Text>
                  </div>
                </Space>
              </Tooltip>
            )}
          />

          <Table.Column
            dataIndex="business"
            title="Contact Person"
            width={250}
            render={(business: any) => <Text>{business?.name}</Text>}
          />

          <Table.Column
            dataIndex="business"
            title="Email"
            width={300}
            render={(business: any) => <Text>{business?.email}</Text>}
          />

          <Table.Column
            dataIndex="business"
            title="Mobile"
            width={180}
            render={(business: any) => <Text>{business?.mobile}</Text>}
          />

          <Table.Column
            dataIndex="stage"
            title="Stage"
            width={160}
            render={(stage: string) => {
              let color: any = "default";
              switch (stage) {
                case "NEW":
                  color = "blue";
                  break;
                case "DISCUSSION":
                  color = "orange";
                  break;
                case "DEMO":
                  color = "purple";
                  break;
                case "PROPOSAL":
                  color = "cyan";
                  break;
                case "DECIDED":
                  color = "green";
                  break;
                case "REJECTED":
                  color = "red";
                  break;
                case "RAW (UNQUALIFIED)":
                  color = "default";
                  break;
              }
              return <Tag color={color}>{stage}</Tag>;
            }}
          />

          {/* Potential column: display numeric currency */}
          <Table.Column
            dataIndex="potential"
            title="Potential"
            width={140}
            render={(potential: number) =>
              potential == null ? (
                <Text type="secondary">-</Text>
              ) : (
                <Text>₹{potential.toLocaleString()}</Text>
              )
            }
          />

          <Table.Column
            dataIndex="since"
            title="Since"
            width={200}
            filterIcon={<FilterOutlined />}
            filterDropdown={(props: any) => {
              // convert props.selectedKeys[0] (string "YYYY-MM-DD|YYYY-MM-DD") to Dayjs tuple or undefined
              const selectedKeys: string[] = props.selectedKeys || [];
              const pickerValue: (Dayjs | null)[] | undefined =
                selectedKeys.length && typeof selectedKeys[0] === "string"
                  ? (selectedKeys[0] as string)
                      .split("|")
                      .map((s: string) => (s ? dayjs(s) : null))
                  : undefined;

              return (
                <div style={{ padding: 12, minWidth: 260 }}>
                  <RangePicker
                    style={{ width: "100%" }}
                    format="YYYY-MM-DD"
                    onChange={(dates, dateStrings) => {
                      if (!dates || dates.length !== 2) {
                        props.setSelectedKeys([]);
                        props.confirm?.();
                        return;
                      }
                      props.setSelectedKeys([dateStrings.join("|")]);
                      props.confirm?.();
                    }}
                    value={pickerValue as any}
                    allowClear
                  />
                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <Button
                      size="small"
                      onClick={() => {
                        props.clearFilters?.();
                        props.confirm?.();
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              );
            }}
            onFilter={(value: any, record: any) => {
              const dateValue = record?.since;
              if (!dateValue) return false;

              const [startStr, endStr] = (value || "").toString().split("|");
              if (!startStr || !endStr) return false;

              const recordTs = new Date(dateValue).setHours(0, 0, 0, 0);
              const startTs = new Date(startStr).setHours(0, 0, 0, 0);
              const endTs = new Date(endStr).setHours(23, 59, 59, 999);
              return recordTs >= startTs && recordTs <= endTs;
            }}
            render={(value: any) => {
              if (!value) return <Text type="secondary">No Date</Text>;
              return <Text>{dayjs(value).format("MMM D, YYYY")}</Text>;
            }}
          />

          <Table.Column
            dataIndex={["assigned_user", "id"]}
            title="Assigned To"
            width={200}
            filterIcon={<FilterOutlined />}
            filterDropdown={(props: any) => (
              <div style={{ padding: 12, minWidth: 220 }}>
                <Select
                  {...(userSelectProps as any)}
                  mode="multiple"
                  placeholder="Select users"
                  value={props.selectedKeys}
                  onChange={(vals: any) => {
                    props.setSelectedKeys(vals);
                    props.confirm?.();
                  }}
                  style={{ width: "100%" }}
                  allowClear
                />
                <div style={{ marginTop: 8, textAlign: "right" }}>
                  <Button
                    size="small"
                    onClick={() => {
                      props.clearFilters?.();
                      props.confirm?.();
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}
            render={(_: any, record: any) => {
              const assigned_user = record.assigned_user;
              return (
                <Space>
                  {assigned_user && (
                    <>
                      <CustomAvatar
                        name={assigned_user?.name}
                        src={assigned_user?.avatar}
                      />
                      <Text>{assigned_user?.name}</Text>
                    </>
                  )}
                  {!assigned_user && <Text type="secondary">Unassigned</Text>}
                </Space>
              );
            }}
          />

          <Table.Column
            dataIndex="product"
            title="Product"
            width={100}
            render={(product: any) => <Text>{product?.name || "-"}</Text>}
          />

          <Table.Column
            dataIndex={["source", "name"]}
            title="Source"
            width={220}
            filterIcon={<FilterOutlined />}
            filterDropdown={(props: any) => (
              <div style={{ padding: 12, minWidth: 260 }}>
                <Select
                  mode="multiple"
                  placeholder="Select source"
                  style={{ width: "100%" }}
                  options={SOCIAL_OPTIONS}
                  value={props.selectedKeys as string[]}
                  onChange={(vals: string[]) => {
                    props.setSelectedKeys(vals);
                    props.confirm?.();
                  }}
                  allowClear
                />
                <div style={{ marginTop: 8, textAlign: "right" }}>
                  <Button
                    size="small"
                    onClick={() => {
                      props.clearFilters?.();
                      props.confirm?.();
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}
            onFilter={(value: any, record: any) => {
              const name = (record?.source?.name || "")
                .toString()
                .toUpperCase();
              return name === (value || "").toString().toUpperCase();
            }}
            render={(_: any, record: any) => {
              const name = record?.source?.name;
              const iconData = getSourceIcon(name);
              return (
                <Space>
                  {iconData && (
                    <span style={{ color: iconData.color, fontSize: 18 }}>
                      {iconData.icon}
                    </span>
                  )}
                  <Text>{name || "-"}</Text>
                </Space>
              );
            }}
          />

          <Table.Column
            title="Actions"
            width={200}
            dataIndex="actions"
            render={(_: any, record: any) => (
              <Space>
                <LeadLogButton
                  leadId={record.id}
                  onSuccess={() => {
                    // Optionally refresh the table or show a success indicator
                  }}
                  onViewClick={(tab) => {
                    setSelectedLeadId(record.id);
                    setSelectedLeadData(record);
                    setInitialTab(tab);
                    setIsDetailModalOpen(true);
                  }}
                />
                {/* <DeleteButton
                  hideText
                  size="small"
                  recordItemId={String(record.id)}
                /> */}
                <Button
                  type="default"
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() => {
                    setSelectedLeadId(record.id);
                    setSelectedLeadData(record);
                    setIsDetailModalOpen(true);
                  }}
                >
                  View
                </Button>
                <EditButton
                  hideText
                  size="small"
                  recordItemId={String(record.id)}
                  onClick={() => {
                    setEditingLeadId(record.id);
                    setEditingLeadData(record);
                    setIsEditModalOpen(true);
                  }}
                />
              </Space>
            )}
          />
        </Table>
      </List>

      {isCreateModalOpen && (
        <LeadFormModal
          action="create"
          opened={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
      {isEditModalOpen && (
        <LeadFormModal
          action="edit"
          opened={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingLeadId(undefined);
            setEditingLeadData(null);
          }}
          leadId={editingLeadId}
          leadData={editingLeadData}
        />
      )}
      {isDetailModalOpen && (
        <LeadDetailModal
          leadId={selectedLeadId}
          leadData={selectedLeadData}
          open={isDetailModalOpen}
          initialTab={initialTab}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedLeadId(null);
            setSelectedLeadData(null);
            setInitialTab("overview");
          }}
          onEdit={() => {
            // Close detail modal and open edit modal with same lead data
            setIsDetailModalOpen(false);
            setEditingLeadId(selectedLeadId || undefined);
            setEditingLeadData(selectedLeadData);
            setIsEditModalOpen(true);
          }}
        />
      )}
      {isMetaImportModalOpen && (
        <MetaImportModal
          opened={isMetaImportModalOpen}
          onClose={() => setIsMetaImportModalOpen(false)}
          onSuccess={() => {
            // Refresh the table after successful import
            window.location.reload();
          }}
        />
      )}
    </>
  );
};
