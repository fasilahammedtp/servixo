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
  isEmailVerified?: boolean;
  verificationStatus?: "pending" | "verified" | "rejected";
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
  isActive?: boolean;
  image?: string;
  jobCount?: number;
  workerCount?: number;
  createdAt?: string;
  updatedAt?: string;
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
  | "worker_rejected"
  | "new_message";

export interface BadgeSummary {
  messages: number;
  bookings: number;
  hiredJobs: number;
  bookingJobIds: string[];
  hiredJobIds: string[];
}

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

export interface ChatMessage {
  _id: string;
  job: string;
  sender: string | { _id: string; name: string; profilePhoto?: string };
  recipient: string;
  text: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  jobId: string;
  category: string;
  otherParty: {
    _id?: string;
    name: string;
    profilePhoto?: string;
  };
  otherPartyName: string;
  otherPartyProfilePhoto?: string;
  lastMessage: {
    text: string;
    time: string;
  };
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
}

export type JobStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "on_the_way"
  | "arrived"
  | "working"
  | "completed"
  | "cancelled";

export interface Job {
  _id: string;
  customer: string | User;
  worker?: {
    _id: string;
    user?: {
      _id: string;
      name: string;
      profilePhoto?: string;
    };
    skills?: string[];
    experienceYears?: number;
    visitingCharge?: number;
    rating?: number;
    totalReviews?: number;
  };
  category: {
    _id: string;
    name: string;
  } | string;
  customTitle?: string;
  description: string;
  images: string[];
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  address?: string;
  status: JobStatus;
  finalPrice?: number;
  isPaid: boolean;
  paymentIssueReported?: boolean;
  paymentIssueReportedAt?: string;
  startedAt?: string;
  createdAt: string;
  updatedAt?: string;
  quotesCount?: number;
  lowestQuote?: number | null;
  unreadMessages?: number;
  review?: {
    rating: number;
  } | null;
}
