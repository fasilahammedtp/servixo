import { api } from "./api";

export async function getMyJobs() {
  const res = await api.get("/jobs/mine");
  return res.data.jobs;
}

export async function getJobById(id: string) {
  const res = await api.get(`/jobs/${id}`);
  return res.data.job;
}

export async function uploadImages(files: File[]) {
  const formData = new FormData();
  files.forEach(file => formData.append("images", file));

  const res = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return res.data.urls as string[];
}

export async function createJob(data: { category: string, description: string, images?: string[], location: { lat: number, lng: number } }) {
  const res = await api.post("/jobs", data);
  return res.data.job;
}

export async function getNearbyJobs() {
  const res = await api.get("/jobs/nearby");
  return res.data.jobs;
}

export async function getWorkerAssignedJobs() {
  const res = await api.get("/jobs/worker/my-jobs");
  return res.data.jobs;
}

export async function getCustomerDashboardStats() {
  const res = await api.get("/jobs/customer/dashboard-stats");
  return res.data as {
    totalBookings: number;
    activeJobs: number;
    completedJobs: number;
    totalSpent: number;
  };
}

export async function getWorkerDashboardStats() {
  const res = await api.get("/jobs/worker/dashboard-stats");
  return res.data as {
    totalJobsCompleted: number;
    totalEarnings: number;
    averageRating: number;
    totalQuotesSent: number;
    acceptanceRate: number;
  };
}

export async function startJob(jobId: string) {
  const res = await api.patch(`/jobs/${jobId}/start`);
  return res.data.job;
}

export async function completeJob(jobId: string) {
  const res = await api.patch(`/jobs/${jobId}/complete`);
  return res.data.job;
}

export async function markJobPaid(jobId: string) {
  const res = await api.patch(`/jobs/${jobId}/mark-paid`);
  return res.data.job;
}

export async function reportPaymentIssue(jobId: string) {
  const res = await api.post(`/jobs/${jobId}/report-payment-issue`);
  return res.data.job;
}


