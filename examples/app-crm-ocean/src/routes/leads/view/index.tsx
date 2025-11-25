import { CustomAvatar } from "@/components/custom-avatar";
import { Text } from "@/components/text";
import type { LeadStage } from "@/interfaces/lead";
import { LEAD_STAGE_COLORS } from "@/interfaces/lead";
import {
  useAppointmentsByLeadId,
  useCreateAppointment,
  useUpdateAppointment,
} from "@/services/appointment.service";
import {
  useContactsByBusinessId,
  useCreateContact,
} from "@/services/contact.service";
import {
  useCreateInteraction,
  useInteractionsByLeadId,
} from "@/services/interaction.service";
import { useUsers } from "@/services/user.service";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ContactsOutlined,
  CopyOutlined,
  DeleteOutlined,
  FacebookOutlined,
  GlobalOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  PlusOutlined,
  TeamOutlined,
  TwitterOutlined,
  UserOutlined,
  VideoCameraOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import { EditButton } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";

dayjs.extend(relativeTime);

const { Title } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Icon mapping for interaction types
const interactionIcons: Record<string, React.ReactNode> = {
  Call: <PhoneOutlined />,
  Meeting: <TeamOutlined />,
  Online: <GlobalOutlined />,
  Email: <MailOutlined />,
  Message: <MessageOutlined />,
  Other: <ClockCircleOutlined />,
};

// Color mapping for interaction types
const interactionColors: Record<string, string> = {
  Call: "blue",
  Meeting: "green",
  Online: "purple",
  Email: "orange",
  Message: "cyan",
  Other: "default",
};

// Icon and color mapping for lead sources
const sourceIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  INSTAGRAM: { icon: <InstagramOutlined />, color: "#E1306C" },
  FACEBOOK: { icon: <FacebookOutlined />, color: "#1877F2" },
  LINKEDIN: { icon: <LinkedinOutlined />, color: "#0A66C2" },
  TWITTER: { icon: <TwitterOutlined />, color: "#1DA1F2" },
  WHATSAPP: { icon: <WhatsAppOutlined />, color: "#25D366" },
};

// Helper function to get source icon and color
const getSourceIcon = (sourceName: string | undefined) => {
  if (!sourceName) return { icon: <GlobalOutlined />, color: "#8c8c8c" };

  const upperSourceName = sourceName.toUpperCase();
  return (
    sourceIcons[upperSourceName] || {
      icon: <GlobalOutlined />,
      color: "#8c8c8c",
    }
  );
};

interface LeadDetailModalProps {
  leadId: string | null;
  leadData: any | null; // Pass lead data from grid
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  initialTab?: string;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  leadData,
  open,
  onClose,
  onEdit,
  initialTab = "overview",
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [form] = Form.useForm();
  const [appointmentForm] = Form.useForm();
  const [contactForm] = Form.useForm();

  // Use passed leadData directly instead of fetching
  const lead = leadData;
  const loading = false; // No loading since we have data from grid

  // Get current user ID from localStorage
  const currentUserId =
    localStorage.getItem("user_id") || lead?.assigned_user?.id;

  // **Use Refine data hooks for automatic caching, error handling, and invalidation**
  // Interactions - automatically fetched and cached
  const {
    result: interactionsData,
    query: { isLoading: interactionsLoading },
  } = useInteractionsByLeadId(open ? leadId || undefined : undefined);
  const interactions = (interactionsData?.data || []).sort((a, b) => {
    // Sort by most recent first (newest to oldest)
    return dayjs(b.interacted_at).valueOf() - dayjs(a.interacted_at).valueOf();
  });

  // Appointments - automatically fetched and cached
  const {
    result: appointmentsData,
    query: { isLoading: appointmentsLoading },
  } = useAppointmentsByLeadId(open ? leadId || undefined : undefined);
  const appointments = (appointmentsData?.data || []).sort((a, b) => {
    const dateA = dayjs(a.scheduled_at);
    const dateB = dayjs(b.scheduled_at);
    const now = dayjs();

    const isUpcomingA = dateA.isAfter(now);
    const isUpcomingB = dateB.isAfter(now);

    // Both upcoming: sort by nearest first
    if (isUpcomingA && isUpcomingB) {
      return dateA.diff(now) - dateB.diff(now);
    }

    // One upcoming, one past: upcoming first
    if (isUpcomingA && !isUpcomingB) return -1;
    if (!isUpcomingA && isUpcomingB) return 1;

    // Both past: sort by most recent first
    return dateB.valueOf() - dateA.valueOf();
  });

  // Users - automatically fetched and cached (shared across all components)
  const {
    result: usersData,
    query: { isLoading: usersLoading },
  } = useUsers();
  const users = usersData?.data || [];

  // Contacts - automatically fetched and cached
  const {
    result: contactsResult,
    query: { isLoading: contactsLoading },
  } = useContactsByBusinessId(open ? lead?.business?.id : undefined);
  const contacts = contactsResult?.data || [];

  // Create interaction mutation - automatic invalidation and notifications
  const {
    mutate: createInteraction,
    mutation: { isPending: isCreatingInteraction },
  } = useCreateInteraction();

  // Create appointment mutation - automatic invalidation and notifications
  const {
    mutate: createAppointment,
    mutation: { isPending: isCreatingAppointment },
  } = useCreateAppointment();

  // Update appointment mutation - automatic invalidation and notifications
  const {
    mutate: updateAppointment,
    mutation: { isPending: isUpdatingAppointment },
  } = useUpdateAppointment();

  // Create contact mutation - automatic invalidation and notifications
  const {
    mutate: createContact,
    mutation: { isPending: isCreatingContact },
  } = useCreateContact();

  // Delete contact mutation
  const { mutate: deleteContact } = useDelete();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setActiveTab("overview");
      setIsAddingActivity(false);
      setIsAddingAppointment(false);
      setIsAddingContact(false);
      form.resetFields();
      appointmentForm.resetFields();
      contactForm.resetFields();
    }
  }, [open, form, appointmentForm, contactForm]);

  // Set active tab when initialTab changes and auto-expand forms
  useEffect(() => {
    if (open && initialTab) {
      setActiveTab(initialTab);

      // Auto-expand the form when coming from Log button
      if (initialTab === "activities") {
        setIsAddingActivity(true);
      } else if (initialTab === "appointments") {
        setIsAddingAppointment(true);
      } else if (initialTab === "contacts") {
        setIsAddingContact(true);
      }
    }
  }, [open, initialTab]);

  const handleAddInteraction = (values: any) => {
    if (!leadId) return;

    const payload = {
      lead_id: leadId,
      note: values.note,
      interaction_type: values.interaction_type,
      interacted_at: values.interacted_at.toISOString(),
    };

    createInteraction(
      { values: payload },
      {
        onSuccess: () => {
          setIsAddingActivity(false);
          form.resetFields();
        },
      },
    );
  };

  const handleAddAppointment = (values: any) => {
    if (!leadId) return;

    if (isEditingAppointment && editingAppointmentId) {
      // Update existing appointment
      const payload = {
        note: values.note,
        appointment_type: values.appointment_type,
        scheduled_at: values.scheduled_at.toISOString(),
        assigned_to: values.assigned_to,
        status: "SCHEDULED",
      };

      updateAppointment(
        { id: editingAppointmentId, values: payload },
        {
          onSuccess: () => {
            setIsEditingAppointment(false);
            setEditingAppointmentId(null);
            setIsAddingAppointment(false);
            appointmentForm.resetFields();
          },
        },
      );
    } else {
      // Create new appointment
      const payload = {
        lead_id: leadId,
        note: values.note,
        appointment_type: values.appointment_type,
        scheduled_at: values.scheduled_at.toISOString(),
        assigned_to: values.assigned_to,
      };

      createAppointment(
        { values: payload },
        {
          onSuccess: () => {
            setIsAddingAppointment(false);
            appointmentForm.resetFields();
          },
        },
      );
    }
  };

  const handleEditAppointment = (appointment: any) => {
    setIsEditingAppointment(true);
    setEditingAppointmentId(appointment.id);
    setIsAddingAppointment(true);
    appointmentForm.setFieldsValue({
      appointment_type: appointment.appointment_type,
      scheduled_at: dayjs(appointment.scheduled_at),
      assigned_to: appointment.assigned_user?.id,
      note: appointment.note,
    });
  };

  const handleCancelAppointmentEdit = () => {
    setIsEditingAppointment(false);
    setEditingAppointmentId(null);
    setIsAddingAppointment(false);
    appointmentForm.resetFields();
  };

  const handleAddContact = (values: any) => {
    if (!lead?.business?.id) return;

    const payload = {
      business_id: lead.business.id,
      name: values.name,
      mobile: values.mobile,
      email: values.email,
    };

    createContact(
      { values: payload },
      {
        onSuccess: () => {
          setIsAddingContact(false);
          contactForm.resetFields();
        },
      },
    );
  };

  const handleDeleteContact = (contactId: string) => {
    deleteContact({
      resource: "contact",
      id: contactId,
    });
  };

  const getStageColor = (stage: string) => {
    return LEAD_STAGE_COLORS[stage as LeadStage] || "default";
  };

  const renderOverviewTab = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      );
    }

    if (!lead) {
      return (
        <Empty description="Lead not found" style={{ margin: "50px 0" }} />
      );
    }

    return (
      <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "8px" }}>
        {/* Contact Information Card */}
        <Card
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Contact Information</span>
              {onEdit && (
                <EditButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit();
                  }}
                  hideText
                />
              )}
            </div>
          }
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Name">
              {lead.business?.name
                ? `${lead.business.name}${lead.business?.designation ? ` (${lead.business.designation})` : ""}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Mobile">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Space>
                  <PhoneOutlined />
                  <Text>{lead.business?.mobile || "-"}</Text>
                </Space>
                {lead.business?.mobile && (
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<WhatsAppOutlined style={{ color: "#25D366" }} />}
                      onClick={() => {
                        const phone = lead.business?.mobile?.replace(/\D/g, "");
                        window.open(`https://wa.me/${phone}`, "_blank");
                      }}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<PhoneOutlined style={{ color: "#1890ff" }} />}
                      onClick={() => {
                        window.location.href = `tel:${lead.business?.mobile}`;
                      }}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(
                          lead.business?.mobile || "",
                        );
                        message.success("Mobile number copied!");
                      }}
                    />
                  </Space>
                )}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Space>
                  <MailOutlined />
                  <Text>{lead.business?.email || "-"}</Text>
                </Space>
                {lead.business?.email && (
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<MailOutlined style={{ color: "#1890ff" }} />}
                      onClick={() => {
                        window.location.href = `mailto:${lead.business?.email}`;
                      }}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(
                          lead.business?.email || "",
                        );
                        message.success("Email copied!");
                      }}
                    />
                  </Space>
                )}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Business Opportunity Card */}
        <Card
          title="Business Opportunity"
          size="small"
          style={{ marginBottom: 16 }}
        >
          {lead.source && (
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">Received on </Text>
              <Text strong>
                {lead.since ? dayjs(lead.since).format("DD-MMM") : "N/A"}
              </Text>
              <Text type="secondary"> from </Text>
              <Space size={4}>
                <span
                  style={{
                    color: getSourceIcon(lead.source?.name).color,
                    fontSize: 16,
                  }}
                >
                  {getSourceIcon(lead.source?.name).icon}
                </span>
                <Text strong>{lead.source?.name || "UNKNOWN"}</Text>
              </Space>
            </div>
          )}

          {(lead.notes || lead.requirements) && (
            <div
              style={{
                padding: "12px",
                background: "#f5f5f5",
                borderRadius: "4px",
                marginBottom: 12,
              }}
            >
              <Text type="secondary">Notes: </Text>
              <div style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                <Text>{lead.notes || lead.requirements || "-"}</Text>
              </div>
            </div>
          )}

          {lead.tags && lead.tags.length > 0 && (
            <Space wrap>
              {lead.tags.map((tag: any, index: number) => (
                <Tag key={index}>#{tag.name || tag}</Tag>
              ))}
            </Space>
          )}
        </Card>

        {/* Lead Summary Card */}
        <Card
          size="small"
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <CustomAvatar
                name={lead.business?.business || lead.business?.name}
                size={40}
              />
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  {lead.business?.business || lead.business?.name}
                </Title>
              </div>
            </Space>
          }
          extra={<Tag color={getStageColor(lead.stage)}>{lead.stage}</Tag>}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Potential">
              <Space>₹{lead.potential?.toLocaleString() || "0"}</Space>
            </Descriptions.Item>
            <Descriptions.Item label="Product">
              {lead.product?.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Assigned To">
              {lead.assigned_user ? (
                <Space>
                  <CustomAvatar name={lead.assigned_user.name} size="small" />
                  {lead.assigned_user.name}
                </Space>
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="GSTIN">
              {lead.business?.gstin || "-"}
            </Descriptions.Item>
          </Descriptions>

          {lead.business?.website && (
            <>
              <Divider style={{ margin: "12px 0" }} />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Website">
                  <Space>
                    <GlobalOutlined />
                    <a
                      href={lead.business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {lead.business.website}
                    </a>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </>
          )}

          {(lead.business?.address_line_1 ||
            lead.business?.city ||
            lead.business?.country) && (
            <>
              <Divider style={{ margin: "12px 0" }} />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Address">
                  {[
                    lead.business?.address_line_1,
                    lead.business?.address_line_2,
                    lead.business?.city,
                    lead.business?.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
        </Card>
      </div>
    );
  };

  const renderActivitiesTab = () => {
    return (
      <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "8px" }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={isAddingActivity ? <CloseOutlined /> : <PlusOutlined />}
            onClick={() => setIsAddingActivity(!isAddingActivity)}
            block
          >
            {isAddingActivity ? "Cancel" : "Log New Activity"}
          </Button>
        </div>

        {/* Activity Form */}
        {isAddingActivity && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddInteraction}
              initialValues={{
                interacted_at: dayjs(),
              }}
            >
              <Form.Item
                name="interaction_type"
                label="Activity Type"
                rules={[
                  { required: true, message: "Please select activity type" },
                ]}
              >
                <Select
                  placeholder="Select activity type"
                  options={[
                    { value: "Call", label: "Call", icon: <PhoneOutlined /> },
                    {
                      value: "Meeting",
                      label: "Meeting",
                      icon: <TeamOutlined />,
                    },
                    {
                      value: "Online",
                      label: "Online Meeting",
                      icon: <VideoCameraOutlined />,
                    },
                    { value: "Email", label: "Email", icon: <MailOutlined /> },
                    {
                      value: "Message",
                      label: "Message",
                      icon: <MessageOutlined />,
                    },
                    {
                      value: "Other",
                      label: "Other",
                      icon: <ClockCircleOutlined />,
                    },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="interacted_at"
                label="Date & Time"
                rules={[
                  { required: true, message: "Please select date and time" },
                ]}
              >
                <DatePicker
                  showTime
                  format="MMM D, YYYY h:mm A"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item
                name="note"
                label="Notes"
                rules={[
                  { required: true, message: "Please enter activity notes" },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe the activity, key discussion points, outcomes, next steps, etc."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button
                    onClick={() => {
                      setIsAddingActivity(false);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isCreatingInteraction}
                  >
                    Save Activity
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* Activities Timeline */}
        <Card
          size="small"
          title={`Activities (${interactions.length})`}
          loading={interactionsLoading}
        >
          {interactions.length === 0 ? (
            <Empty
              description="No activities yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddingActivity(true)}
              >
                Schedule First Activity
              </Button>
            </Empty>
          ) : (
            <Timeline
              items={interactions.map((interaction) => ({
                dot: interactionIcons[interaction.interaction_type],
                color: interactionColors[interaction.interaction_type],
                children: (
                  <div style={{ paddingBottom: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <Space>
                        <Tag
                          color={
                            interactionColors[interaction.interaction_type]
                          }
                        >
                          {interaction.interaction_type}
                        </Tag>
                        <Text strong>
                          {interaction.interacted_by_user?.name}
                        </Text>
                      </Space>
                      <Text type="secondary">
                        {dayjs(interaction.interacted_at).fromNow()}
                      </Text>
                    </div>
                    <Text>{interaction.note}</Text>
                    <div style={{ marginTop: "4px" }}>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {dayjs(interaction.interacted_at).format(
                          "MMM D, YYYY [at] h:mm A",
                        )}
                      </Text>
                    </div>
                  </div>
                ),
              }))}
            />
          )}
        </Card>
      </div>
    );
  };

  const renderAppointmentsTab = () => {
    return (
      <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "8px" }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={isAddingAppointment ? <CloseOutlined /> : <PlusOutlined />}
            onClick={() => {
              if (isAddingAppointment) {
                handleCancelAppointmentEdit();
              } else {
                setIsAddingAppointment(true);
              }
            }}
            block
          >
            {isAddingAppointment ? "Cancel" : "Schedule New Appointment"}
          </Button>
        </div>

        {/* Appointment Form */}
        {isAddingAppointment && (
          <Card
            size="small"
            style={{ marginBottom: 16 }}
            title={
              isEditingAppointment ? "Edit Appointment" : "New Appointment"
            }
          >
            <Form
              form={appointmentForm}
              layout="vertical"
              onFinish={handleAddAppointment}
              initialValues={{
                scheduled_at: dayjs().add(1, "day").hour(10).minute(0),
                assigned_to: currentUserId,
              }}
            >
              <Form.Item
                name="appointment_type"
                label="Appointment Type"
                rules={[
                  { required: true, message: "Please select appointment type" },
                ]}
              >
                <Select
                  size="large"
                  placeholder="Select appointment type"
                  options={[
                    { value: "Call", label: "Call", icon: <PhoneOutlined /> },
                    {
                      value: "Meeting",
                      label: "Meeting",
                      icon: <TeamOutlined />,
                    },
                    {
                      value: "Online",
                      label: "Online Meeting",
                      icon: <VideoCameraOutlined />,
                    },
                    { value: "Email", label: "Email", icon: <MailOutlined /> },
                    {
                      value: "Message",
                      label: "Message",
                      icon: <MessageOutlined />,
                    },
                    {
                      value: "Other",
                      label: "Other",
                      icon: <ClockCircleOutlined />,
                    },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="scheduled_at"
                label="Schedule Date & Time"
                rules={[
                  { required: true, message: "Please select date and time" },
                ]}
              >
                <DatePicker
                  showTime
                  format="DD-MMM-YY hh:mm A"
                  style={{ width: "100%" }}
                  size="large"
                  disabledDate={(current) => {
                    return current && current < dayjs().startOf("day");
                  }}
                />
              </Form.Item>

              <Form.Item
                name="assigned_to"
                label="Assign To"
                rules={[{ required: true, message: "Please select assignee" }]}
              >
                <Select
                  size="large"
                  placeholder="Please select sales owner user"
                  loading={usersLoading}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={users.map((user) => ({
                    value: user.id,
                    label: user.name,
                    user: user,
                  }))}
                  optionRender={(option) => (
                    <Space>
                      <CustomAvatar name={option.data.user.name} size="small" />
                      <span>{option.data.user.name}</span>
                    </Space>
                  )}
                />
              </Form.Item>

              <Form.Item
                name="note"
                label="Notes"
                rules={[
                  { required: true, message: "Please enter appointment notes" },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Meeting agenda, discussion points, preparation notes..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button onClick={handleCancelAppointmentEdit}>Cancel</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isCreatingAppointment || isUpdatingAppointment}
                  >
                    {isEditingAppointment
                      ? "Update Appointment"
                      : "Schedule Appointment"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* Appointments List */}
        <Card
          size="small"
          title={`Upcoming & Past Appointments (${appointments.length})`}
          loading={appointmentsLoading}
        >
          {appointments.length === 0 ? (
            <Empty
              description="No appointments scheduled"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddingAppointment(true)}
              >
                Schedule First Appointment
              </Button>
            </Empty>
          ) : (
            <List
              dataSource={appointments}
              renderItem={(appointment) => {
                const isUpcoming = dayjs(appointment.scheduled_at).isAfter(
                  dayjs(),
                );
                const isPast = dayjs(appointment.scheduled_at).isBefore(
                  dayjs(),
                );
                const isToday = dayjs(appointment.scheduled_at).isSame(
                  dayjs(),
                  "day",
                );

                return (
                  <List.Item
                    key={appointment.id}
                    style={{
                      padding: "16px",
                      background: isToday
                        ? "#e6f7ff"
                        : isUpcoming
                          ? "#f6ffed"
                          : "#fafafa",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      border: `1px solid ${isToday ? "#91d5ff" : isUpcoming ? "#b7eb8f" : "#d9d9d9"}`,
                    }}
                    actions={[
                      <EditButton
                        key="edit"
                        size="small"
                        hideText
                        onClick={() => handleEditAppointment(appointment)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ position: "relative" }}>
                          {interactionIcons[appointment.appointment_type]}
                          {isToday && (
                            <Badge
                              status="processing"
                              style={{
                                position: "absolute",
                                top: -5,
                                right: -5,
                              }}
                            />
                          )}
                        </div>
                      }
                      title={
                        <Space>
                          <Tag
                            color={
                              interactionColors[appointment.appointment_type]
                            }
                          >
                            {appointment.appointment_type}
                          </Tag>
                          {isToday && <Tag color="blue">Today</Tag>}
                          {isUpcoming && !isToday && (
                            <Tag color="green">Upcoming</Tag>
                          )}
                          {isPast && <Tag color="default">Past</Tag>}
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 8 }}>
                            <Space>
                              <CalendarOutlined />
                              <Text strong>
                                {dayjs(appointment.scheduled_at).format(
                                  "DD-MMM-YY",
                                )}
                              </Text>
                              <ClockCircleOutlined />
                              <Text strong>
                                {dayjs(appointment.scheduled_at).format(
                                  "hh:mm A",
                                )}
                              </Text>
                              <Text type="secondary">
                                ({dayjs(appointment.scheduled_at).fromNow()})
                              </Text>
                            </Space>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <Space>
                              <UserOutlined />
                              <Text>Assigned to:</Text>
                              <CustomAvatar
                                name={appointment.assigned_user?.name}
                                size="small"
                              />
                              <Text strong>
                                {appointment.assigned_user?.name}
                              </Text>
                            </Space>
                          </div>
                          <div
                            style={{
                              padding: "8px 12px",
                              background: "#ffffff",
                              borderRadius: "4px",
                              border: "1px solid #f0f0f0",
                            }}
                          >
                            <Text>{appointment.note}</Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Card>
      </div>
    );
  };

  const renderContactsTab = () => {
    return (
      <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "8px" }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={isAddingContact ? <CloseOutlined /> : <PlusOutlined />}
            onClick={() => setIsAddingContact(!isAddingContact)}
            block
          >
            {isAddingContact ? "Cancel" : "Add New Contact"}
          </Button>
        </div>

        {/* Contact Form */}
        {isAddingContact && (
          <Card size="small" style={{ marginBottom: 16 }} title="New Contact">
            <Form
              form={contactForm}
              layout="vertical"
              onFinish={handleAddContact}
            >
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Please enter name" }]}
              >
                <Input
                  placeholder="Enter contact name"
                  size="large"
                  prefix={<UserOutlined />}
                />
              </Form.Item>

              <Form.Item name="mobile" label="Mobile">
                <Input
                  placeholder="+911234567890"
                  size="large"
                  prefix={<PhoneOutlined />}
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
                  placeholder="email@example.com"
                  size="large"
                  prefix={<MailOutlined />}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button
                    onClick={() => {
                      setIsAddingContact(false);
                      contactForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isCreatingContact}
                  >
                    Add Contact
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* Contacts List */}
        <Card
          size="small"
          title={`Contacts (${contacts.length})`}
          loading={contactsLoading}
        >
          {contacts.length === 0 ? (
            <Empty
              description="No contacts yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddingContact(true)}
              >
                Add First Contact
              </Button>
            </Empty>
          ) : (
            <List
              dataSource={contacts}
              renderItem={(contact) => (
                <List.Item
                  key={contact.id}
                  style={{
                    padding: "16px",
                    background: "#fafafa",
                    marginBottom: "8px",
                    borderRadius: "8px",
                    border: "1px solid #d9d9d9",
                  }}
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="Delete Contact"
                      description="Are you sure you want to delete this contact?"
                      onConfirm={() => handleDeleteContact(contact.id!)}
                      okText="Yes"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <CustomAvatar name={contact.name || "N/A"} size="large" />
                    }
                    title={
                      <Space direction="vertical" size={4}>
                        <Text strong style={{ fontSize: "16px" }}>
                          {contact.name || "N/A"}
                        </Text>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={8}>
                        {contact.mobile && (
                          <Space>
                            <PhoneOutlined />
                            <Text>{contact.mobile}</Text>
                            <Button
                              type="text"
                              size="small"
                              icon={
                                <WhatsAppOutlined
                                  style={{ color: "#25D366" }}
                                />
                              }
                              onClick={() => {
                                const phone = contact.mobile?.replace(
                                  /\D/g,
                                  "",
                                );
                                window.open(`https://wa.me/${phone}`, "_blank");
                              }}
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={
                                <PhoneOutlined style={{ color: "#1890ff" }} />
                              }
                              onClick={() => {
                                window.location.href = `tel:${contact.mobile}`;
                              }}
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  contact.mobile || "",
                                );
                                message.success("Mobile number copied!");
                              }}
                            />
                          </Space>
                        )}
                        {contact.email && (
                          <Space>
                            <MailOutlined />
                            <Text>{contact.email}</Text>
                            <Button
                              type="text"
                              size="small"
                              icon={
                                <MailOutlined style={{ color: "#1890ff" }} />
                              }
                              onClick={() => {
                                window.location.href = `mailto:${contact.email}`;
                              }}
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  contact.email || "",
                                );
                                message.success("Email copied!");
                              }}
                            />
                          </Space>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <TeamOutlined />
          <span>Lead Details</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "overview",
            label: (
              <span>
                <UserOutlined /> Overview
              </span>
            ),
            children: renderOverviewTab(),
          },
          {
            key: "activities",
            label: (
              <span>
                <ClockCircleOutlined /> Activities
                {interactions.length > 0 && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {interactions.length}
                  </Tag>
                )}
              </span>
            ),
            children: renderActivitiesTab(),
          },
          {
            key: "appointments",
            label: (
              <span>
                <CalendarOutlined /> Appointments
                {appointments.length > 0 && (
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    {appointments.length}
                  </Tag>
                )}
              </span>
            ),
            children: renderAppointmentsTab(),
          },
          {
            key: "contacts",
            label: (
              <span>
                <ContactsOutlined /> Contacts
                {contacts.length > 0 && (
                  <Tag color="purple" style={{ marginLeft: 8 }}>
                    {contacts.length}
                  </Tag>
                )}
              </span>
            ),
            children: renderContactsTab(),
          },
        ]}
      />
    </Modal>
  );
};
