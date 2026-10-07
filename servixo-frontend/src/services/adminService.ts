import { api } from "./api";

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
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const res = await api.get<PlatformStats>("/admin/stats");
  return res.data;
}

export interface PaymentIssueJob {
  _id: string;
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
