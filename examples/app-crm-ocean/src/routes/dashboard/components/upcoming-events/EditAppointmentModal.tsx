import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import type { Appointment } from "@/interfaces/appointment";
import { AppointmentType } from "@/interfaces/appointment";
import { useUpdateAppointment } from "@/services/appointment.service";
import { useUsers } from "@/services/user.service";

interface EditAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

export const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  open,
  onClose,
  appointment,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [isUpdating, setIsUpdating] = useState(false);
  const { mutate: updateAppointment } = useUpdateAppointment();
  const {
    query: { data: usersData, isLoading: isLoadingUsers },
  } = useUsers();
  const users = usersData?.data || [];

  // Populate form when appointment changes
  useEffect(() => {
    if (appointment && open) {
      form.setFieldsValue({
        appointment_type: appointment.appointment_type,
        scheduled_at: appointment.scheduled_at
          ? dayjs(appointment.scheduled_at)
          : null,
        assigned_to: appointment.assigned_user?.id,
        note: appointment.note,
      });
    }
  }, [appointment, open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!appointment) return;

      const payload = {
        note: values.note,
        appointment_type: values.appointment_type,
        scheduled_at: values.scheduled_at.toISOString(),
        status: "SCHEDULED",
        assigned_to: values.assigned_to,
      };

      setIsUpdating(true);
      updateAppointment(
        {
          id: appointment.id,
          values: payload,
          resource: "appointment",
        },
        {
          onSuccess: () => {
            setIsUpdating(false);
            form.resetFields();
            onClose();
            onSuccess();
          },
          onError: (error: any) => {
            setIsUpdating(false);
          },
        },
      );
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Edit Appointment"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="Update Appointment"
      cancelText="Cancel"
      confirmLoading={isUpdating}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        style={{ marginTop: 24 }}
      >
        <Form.Item
          label="Appointment Type"
          name="appointment_type"
          rules={[
            {
              required: true,
              message: "Please select an appointment type",
            },
          ]}
        >
          <Select
            placeholder="Select appointment type"
            size="large"
            options={[
              { label: "Call", value: AppointmentType.CALL },
              { label: "Meeting", value: AppointmentType.MEETING },
              { label: "Online Meeting", value: AppointmentType.ONLINE },
              { label: "Email", value: AppointmentType.EMAIL },
              { label: "Message", value: AppointmentType.MESSAGE },
              { label: "Other", value: AppointmentType.OTHER },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Schedule Date & Time"
          name="scheduled_at"
          rules={[
            {
              required: true,
              message: "Please select date and time",
            },
          ]}
        >
          <DatePicker
            showTime
            format="DD-MMM-YY hh:mm A"
            size="large"
            style={{ width: "100%" }}
            placeholder="Select date and time"
          />
        </Form.Item>

        <Form.Item
          label="Assign To"
          name="assigned_to"
          rules={[
            {
              required: true,
              message: "Please assign to a user",
            },
          ]}
        >
          <Select
            placeholder="Select user"
            size="large"
            loading={isLoadingUsers}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={users.map((user: any) => ({
              label: user.name,
              value: user.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Notes"
          name="note"
          rules={[
            {
              required: true,
              message: "Please add notes",
            },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Add notes"
            maxLength={1000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
