export type UserRole = "customer" | "worker" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  profilePhoto?: string;
  hasWorkerProfile?: boolean;
  hasCustomerProfile?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  emailSent?: boolean;
  devOnly_otp?: string;
}

export interface Category {
  _id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface Quotation {
  _id: string;
  job: string | any;
  worker: string | any;
  price: number;
  etaMinutes: number;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "job_matched"
  | "quote_received"
  | "quote_accepted"
  | "job_started"
  | "job_completed"
  | "payment_confirmed"
  | "payment_reminder"
  | "review_received"
  | "worker_verified"
  | "worker_rejected";

export interface AppNotification {
  _id: string;
  recipient: string;
  type: NotificationType;
  message: string;
  job?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
