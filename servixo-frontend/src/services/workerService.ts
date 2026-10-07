import { api } from "./api";

export async function updateWorkerProfile(userId: string, data: {
  skills?: string[];
  experienceYears?: number;
  serviceRadiusKm?: number;
  visitingCharge?: number;
  location?: { lat: number; lng: number };
}) {
  const res = await api.put(`/workers/${userId}/profile`, data);
  return res.data.worker;
}

export async function getWorkers() {
  const res = await api.get("/workers");
  return res.data.workers;
}

export async function getWorkerProfile(userId: string) {
  const res = await api.get(`/workers/${userId}`);
  return res.data.worker;
}

export async function toggleAvailability(userId: string, isAvailable: boolean, location?: { lat: number, lng: number }) {
  const res = await api.put(`/workers/${userId}/availability`, { isAvailable, location });
  return res.data.worker;
}

export async function becomeWorker(data: {
  skills?: string[];
  experienceYears?: number;
  serviceRadiusKm?: number;
  visitingCharge?: number;
  location?: { lat: number; lng: number };
}) {
  const res = await api.post("/workers/become-worker", data);
  return res.data;
}
