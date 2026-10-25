import { api } from "./api";
import { Category } from "../types";

export interface PendingWorker {
  _id: string;
  skills: string[];
  experienceYears: number;
  verificationStatus: "pending" | "verified" | "rejected";
  user: {
    _id?: string;
    name: string;
    email: string;
  } | null;
}

export async function getPendingWorkers(): Promise<PendingWorker[]> {
  const res = await api.get<{ workers: PendingWorker[] }>("/admin/workers/pending");
  return res.data.workers;
}

export async function verifyWorker(workerId: string): Promise<PendingWorker> {
  const res = await api.patch<{ worker: PendingWorker }>(`/admin/workers/${workerId}/verify`);
  return res.data.worker;
}

export async function rejectWorker(workerId: string): Promise<PendingWorker> {
  const res = await api.patch<{ worker: PendingWorker }>(`/admin/workers/${workerId}/reject`);
  return res.data.worker;
}

export interface PlatformStats {
  totalUsers: number;
  totalCustomers: number;
  totalWorkers: number;
  jobsByStatus: {
    pending: number;
    accepted: number;
    in_progress: number;
    completed: number;
  };
  totalCompletedJobs: number;
  totalPlatformRevenue: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const res = await api.get<PlatformStats>("/admin/stats");
  return res.data;
}

export interface PaymentIssueJob {
  _id: string;
  description?: string;
  finalPrice?: number;
  paymentIssueReported: boolean;
  paymentIssueReportedAt?: string;
  isPaid: boolean;
  customer: {
    _id?: string;
    name: string;
    email: string;
  } | null;
  worker: {
    _id?: string;
    user: {
      _id?: string;
      name: string;
      email: string;
    } | null;
  } | null;
  category: {
    _id?: string;
    name: string;
  } | null;
}

export async function getPaymentIssues(): Promise<PaymentIssueJob[]> {
  const res = await api.get<{ jobs: PaymentIssueJob[] }>("/admin/payment-issues");
  return res.data.jobs;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "worker" | "admin";
  isBlocked: boolean;
  createdAt: string;
}

export async function getAdminUsers(params?: { role?: string; search?: string }): Promise<AdminUser[]> {
  const res = await api.get<{ users: AdminUser[] }>("/admin/users", { params });
  return res.data.users;
}

export async function blockUser(userId: string): Promise<AdminUser> {
  const res = await api.patch<{ user: AdminUser }>(`/admin/users/${userId}/block`);
  return res.data.user;
}

export async function unblockUser(userId: string): Promise<AdminUser> {
  const res = await api.patch<{ user: AdminUser }>(`/admin/users/${userId}/unblock`);
  return res.data.user;
}

export interface AdminUserCustomerSection {
  totalJobsPosted: number;
  countsByStatus: Record<string, number>;
  totalSpent: number;
  unpaidCompleted: {
    count: number;
    amount: number;
  };
  reviewsGiven: number;
}

export interface AdminUserWorkerSection {
  verificationStatus: "pending" | "verified" | "rejected";
  isAvailable: boolean;
  skills: string[];
  serviceRadiusKm: number;
  experienceYears: number;
  visitingCharge: number;
  jobsHired: number;
  countsByStatus: Record<string, number>;
  completedJobs: number;
  totalEarnings: number;
  pendingPayout: number;
  commissionGenerated: number;
  quotesSent: number;
  quotesAccepted: number;
  acceptanceRate: number;
  averageRating: number;
  totalReviews: number;
  paymentIssuesReported: number;
}

export interface AdminUserRecentJob {
  _id: string;
  category: string;
  status: string;
  price?: number;
  createdAt: string;
  otherPartyName: string;
  role: "customer" | "worker";
}

export interface AdminUserRecentReview {
  _id: string;
  rating: number;
  comment?: string;
  customerName: string;
  createdAt: string;
}

export interface AdminUserDetails {
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: "customer" | "worker" | "admin";
    isBlocked: boolean;
    isEmailVerified: boolean;
    createdAt: string;
    profilePhoto?: string;
  };
  customer: AdminUserCustomerSection | null;
  worker: AdminUserWorkerSection | null;
  recentJobs: AdminUserRecentJob[];
  recentReviews: AdminUserRecentReview[];
}

export async function getAdminUserDetails(userId: string): Promise<AdminUserDetails> {
  const res = await api.get<AdminUserDetails>(`/admin/users/${userId}/details`);
  return res.data;
}

export async function getAdminCategories(): Promise<Category[]> {
  const res = await api.get<{ categories: Category[] }>("/admin/categories");
  return res.data.categories;
}

export async function createAdminCategory(data: {
  name: string;
  icon?: string;
  image: string;
  description?: string;
}): Promise<Category> {
  const res = await api.post<{ category: Category }>("/admin/categories", data);
  return res.data.category;
}

export async function updateAdminCategory(
  id: string,
  data: {
    icon?: string;
    image?: string;
    isActive?: boolean;
    description?: string;
  }
): Promise<Category> {
  const res = await api.patch<{ category: Category }>(`/admin/categories/${id}`, data);
  return res.data.category;
}



