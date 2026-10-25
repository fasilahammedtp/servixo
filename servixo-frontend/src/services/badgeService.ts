import { api } from "./api";
import { BadgeSummary } from "../types";

export async function getBadgeSummary(): Promise<BadgeSummary> {
  const res = await api.get<BadgeSummary>("/badges/summary");
  return res.data;
}

export async function markBadgesSeen(section: "bookings" | "hiredJobs"): Promise<{ message: string; modifiedCount: number }> {
  const res = await api.patch<{ message: string; modifiedCount: number }>("/badges/seen", { section });
  return res.data;
}
