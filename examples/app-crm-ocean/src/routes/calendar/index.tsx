import { useState } from "react";
import {
  Card,
  Calendar as AntCalendar,
  Badge,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Typography,
  List,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  PhoneOutlined,
  TeamOutlined,
  MailOutlined,
  MessageOutlined,
  SettingOutlined,
  EditOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useGetIdentity } from "@refinedev/core";
import {
  useUpcomingAppointments,
  useAllAppointments,
  useUpdateAppointment,
} from "@/services/appointment.service";
import { useLatestInteractions } from "@/services/interaction.service";
import type { Appointment } from "@/interfaces/appointment";
import { AppointmentStatus } from "@/interfaces/appointment";
import type { Interaction } from "@/interfaces/interaction";
import { EditAppointmentModal } from "@/routes/dashboard/components/upcoming-events/EditAppointmentModal";

const { Title, Text } = Typography;
const { TextArea } = Input;

type EventCategory = "Meeting" | "Holiday" | "Conference" | "Birthday";

const categoryColors: Record<string, string> = {
  Call: "#1890ff",
  Meeting: "#52c41a",
  "Online Meeting": "#722ed1",
  Email: "#fa8c16",
  Message: "#eb2f96",
  Other: "#8c8c8c",
};

const categories: EventCategory[] = [
  "Meeting",
  "Holiday",
  "Conference",
  "Birthday",
];

export const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { data: identity } = useGetIdentity<{ id: string }>();

  // Fetch appointments and interactions
  const { data: upcomingAppointments = [] } = useUpcomingAppointments(5);
  const { data: allAppointments = [], refetch } = useAllAppointments(100);
  const { data: interactions = [] } = useLatestInteractions(50);
  const { mutate: updateAppointment } = useUpdateAppointment();

  // Combine appointments and interactions into events
  const allEvents = [
    ...allAppointments.map((apt) => ({
      id: apt.id,
      type: "appointment" as const,
      title: apt.note || "Appointment",
      date: dayjs(apt.scheduled_at),
      category: apt.appointment_type,
      color: categoryColors[apt.appointment_type] || categoryColors.Other,
      data: apt,
    })),
    ...interactions.map((int) => ({
      id: int.id,
      type: "interaction" as const,
      title: int.note || "Interaction",
      date: dayjs(int.interacted_at),
      category: int.interaction_type,
      color: categoryColors[int.interaction_type] || categoryColors.Other,
      data: int,
    })),
  ];

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs) => {
    return allEvents.filter((event) => event.date.isSame(date, "day"));
  };

  // Get events for selected date
  const selectedDateEvents = getEventsForDate(selectedDate);

  // Calendar cell renderer
  const dateCellRender = (value: Dayjs) => {
    const events = getEventsForDate(value);
    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {events.slice(0, 3).map((event) => (
          <li key={event.id} style={{ marginBottom: 2 }}>
            <Badge
              color={event.color}
              text={
                <Text
                  ellipsis
                  style={{
                    fontSize: "12px",
                    maxWidth: "100px",
                    display: "inline-block",
                  }}
                >
                  {event.title}
                </Text>
              }
            />
          </li>
        ))}
        {events.length > 3 && (
          <li>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              +{events.length - 3} more
            </Text>
          </li>
        )}
      </ul>
    );
  };

  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
  };

  const handleEditClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleEditSuccess = () => {
    refetch();
  };

  const handleMarkAsDone = (appointment: Appointment) => {
    Modal.confirm({
      title: "Mark Appointment as Done",
      content: "Are you sure you want to mark this appointment as completed?",
      okText: "Yes, Mark as Done",
      cancelText: "Cancel",
      onOk: () => {
        setMarkingDone(appointment.id);
        updateAppointment(
          {
            id: appointment.id,
            values: {
              note: appointment.note,
              appointment_type: appointment.appointment_type,
              scheduled_at: appointment.scheduled_at,
              status: AppointmentStatus.COMPLETED,
              assigned_to: appointment.assigned_user.id,
            },
            resource: "appointment",
          },
          {
            onSuccess: () => {
              setMarkingDone(null);
              refetch();
            },
            onError: () => {
              setMarkingDone(null);
            },
          },
        );
      },
    });
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", gap: "24px" }}>
        {/* Left Sidebar */}
        <div style={{ width: "300px", flexShrink: 0 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Upcoming Appointments Card */}
            <Card
              size="small"
              title={
                <Space>
                  <CalendarOutlined />
                  <Text strong>Upcoming Appointments</Text>
                </Space>
              }
            >
              {upcomingAppointments.length === 0 ? (
                <Text type="secondary">No Upcoming Appointment</Text>
              ) : (
                <List
                  dataSource={upcomingAppointments}
                  renderItem={(item) => (
                    <List.Item
                      style={{ padding: "8px 0", border: "none" }}
                      extra={
                        <Space size="small">
                          {item.status === AppointmentStatus.SCHEDULED && (
                            <Button
                              type="text"
                              size="small"
                              icon={<CheckOutlined />}
                              onClick={() => handleMarkAsDone(item)}
                              loading={markingDone === item.id}
                              title="Mark as Done"
                            />
                          )}
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditClick(item)}
                            title="Edit"
                          />
                        </Space>
                      }
                    >
                      <Space
                        direction="vertical"
                        size={0}
                        style={{ width: "100%" }}
                      >
                        <Text strong style={{ fontSize: "12px" }}>
                          {dayjs(item.scheduled_at).format("MMM DD, hh:mm A")}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {item.note || "No description"}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </Card>

            {/* Categories Card */}
            <Card
              size="small"
              title={
                <Space>
                  <CalendarOutlined />
                  <Text strong>Categories</Text>
                </Space>
              }
              extra={
                <Button type="text" size="small" icon={<SettingOutlined />} />
              }
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {Object.entries(categoryColors).map(([category, color]) => (
                  <div
                    key={category}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Badge color={color} />
                    <Text style={{ fontSize: "13px" }}>{category}</Text>
                  </div>
                ))}
              </Space>
            </Card>
          </Space>
        </div>

        {/* Main Calendar */}
        <div style={{ flex: 1 }}>
          <Card>
            <AntCalendar
              value={selectedDate}
              onSelect={onSelect}
              cellRender={dateCellRender}
              headerRender={({ value, onChange }) => {
                const month = value.month();
                const year = value.year();

                return (
                  <div
                    style={{
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      <Button
                        onClick={() =>
                          onChange(value.clone().subtract(1, "month"))
                        }
                      >
                        &lt;
                      </Button>
                      <Title level={4} style={{ margin: 0 }}>
                        {value.format("MMMM YYYY")}
                      </Title>
                      <Button
                        onClick={() => onChange(value.clone().add(1, "month"))}
                      >
                        &gt;
                      </Button>
                    </Space>
                    <Space>
                      <Button onClick={() => onChange(dayjs())}>Today</Button>
                      <Button.Group>
                        <Button>Month</Button>
                        <Button>Week</Button>
                        <Button>Day</Button>
                        <Button>List</Button>
                      </Button.Group>
                    </Space>
                  </div>
                );
              }}
            />

            {/* Selected Date Events */}
            {selectedDateEvents.length > 0 && (
              <div
                style={{
                  marginTop: "24px",
                  padding: "16px",
                  background: "#fafafa",
                  borderRadius: "8px",
                }}
              >
                <Title level={5}>
                  Events on {selectedDate.format("MMMM DD, YYYY")}
                </Title>
                <List
                  dataSource={selectedDateEvents}
                  renderItem={(event) => (
                    <List.Item
                      actions={
                        event.type === "appointment"
                          ? [
                              <Space key="actions" size="small">
                                {(event.data as Appointment).status ===
                                  AppointmentStatus.SCHEDULED && (
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<CheckOutlined />}
                                    onClick={() =>
                                      handleMarkAsDone(
                                        event.data as Appointment,
                                      )
                                    }
                                    loading={markingDone === event.id}
                                    title="Mark as Done"
                                  />
                                )}
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() =>
                                    handleEditClick(event.data as Appointment)
                                  }
                                  title="Edit"
                                />
                              </Space>,
                            ]
                          : undefined
                      }
                    >
                      <List.Item.Meta
                        avatar={<Badge color={event.color} />}
                        title={
                          <Space>
                            <Text strong>{event.title}</Text>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {event.date.format("hh:mm A")}
                            </Text>
                          </Space>
                        }
                        description={
                          <Space>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {event.type === "appointment"
                                ? "Appointment"
                                : "Interaction"}
                            </Text>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              • {event.category}
                            </Text>
                            {event.type === "appointment" &&
                              (event.data as Appointment).status ===
                                AppointmentStatus.COMPLETED && (
                                <Text
                                  type="success"
                                  style={{ fontSize: "12px" }}
                                >
                                  • Completed
                                </Text>
                              )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      <EditAppointmentModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        appointment={selectedAppointment}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};
