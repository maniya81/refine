export interface Appointment {
  id: string;
  note: string;
  appointment_type: AppointmentType;
  scheduled_at: string;
  assigned_user: AssignedUser;
  lead_id?: string;
  business?: {
    business: string;
    name: string;
    title: string;
  };
  status: AppointmentStatus;
}

export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface AssignedUser {
  id: string;
  name: string;
}

export enum AppointmentType {
  CALL = "Call",
  MEETING = "Meeting",
  ONLINE = "Online",
  EMAIL = "Email",
  MESSAGE = "Message",
  OTHER = "Other",
}

export interface CreateAppointmentPayload {
  lead_id: string;
  note: string;
  appointment_type: AppointmentType;
  scheduled_at: string;
  assigned_to: string;
}

export interface UpdateAppointmentPayload {
  note: string;
  appointment_type: AppointmentType;
  scheduled_at: string;
  status?: string;
  assigned_to: string;
}
