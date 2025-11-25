import {
  CalendarOutlined,
  EditOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Card,
  List,
  Skeleton as AntdSkeleton,
  Button,
  App,
  Space,
  Modal,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";

import { Text } from "@/components";
import {
  useUpcomingAppointments,
  useUpdateAppointment,
} from "@/services/appointment.service";
import { EditAppointmentModal } from "./EditAppointmentModal";
import type { Appointment } from "@/interfaces/appointment";
import { AppointmentStatus } from "@/interfaces/appointment";

// Color mapping for appointment types
const appointmentColors: Record<string, string> = {
  Call: "#1890ff",
  Meeting: "#52c41a",
  Email: "#722ed1",
  Task: "#fa8c16",
  Other: "#eb2f96",
};

function getAppointmentTitle(item: any): string {
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

export const CalendarUpcomingEvents = () => {
  const {
    data: appointments = [],
    isLoading,
    refetch,
  } = useUpcomingAppointments(5);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const { mutate: updateAppointment } = useUpdateAppointment();

  const handleEditClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleSuccess = () => {
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
    <Card
      style={{
        height: "100%",
      }}
      headStyle={{ padding: "8px 16px" }}
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
          <CalendarOutlined />
          <Text size="sm" style={{ marginLeft: ".7rem" }}>
            Upcoming Appointments
          </Text>
        </div>
      }
    >
      {isLoading ? (
        <List
          itemLayout="horizontal"
          dataSource={Array.from({ length: 5 }).map((_, index) => ({
            id: index,
          }))}
          renderItem={() => {
            return (
              <List.Item>
                <List.Item.Meta
                  avatar={<Badge color="transparent" />}
                  title={
                    <AntdSkeleton.Button
                      active
                      style={{
                        height: "14px",
                      }}
                    />
                  }
                  description={
                    <AntdSkeleton.Button
                      active
                      style={{
                        width: "300px",
                        marginTop: "8px",
                        height: "16px",
                      }}
                    />
                  }
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={appointments}
          renderItem={(item) => {
            const scheduledDate = dayjs(item.scheduled_at).format(
              "MMM DD, YYYY - hh:mm A",
            );
            const personTitle = getAppointmentTitle(item);
            const color =
              appointmentColors[item.appointment_type] ||
              appointmentColors.Other;

            return (
              <List.Item
                actions={[
                  <Space key="actions" size="small">
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
                  </Space>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Badge color={color} />}
                  title={
                    <Text size="xs">
                      {personTitle
                        ? `${personTitle} — ${scheduledDate}`
                        : scheduledDate}
                    </Text>
                  }
                  description={
                    <div>
                      <Text ellipsis={{ tooltip: true }} strong>
                        {item.note || "No description"}
                      </Text>
                      <Text
                        size="xs"
                        type="secondary"
                        style={{ marginLeft: "8px" }}
                      >
                        • {item.appointment_type}
                      </Text>
                      {item.status === AppointmentStatus.COMPLETED && (
                        <Text
                          size="xs"
                          type="success"
                          style={{ marginLeft: "8px" }}
                        >
                          • Completed
                        </Text>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      {!isLoading && appointments.length === 0 && <NoEvent />}

      <EditAppointmentModal
        open={editModalOpen}
        onClose={handleCloseModal}
        appointment={selectedAppointment}
        onSuccess={handleSuccess}
      />
    </Card>
  );
};

const NoEvent = () => (
  <span
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "220px",
    }}
  >
    No Upcoming Appointments
  </span>
);
