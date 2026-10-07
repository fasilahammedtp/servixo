import { api } from "./api";
import { AuthResponse, UserRole } from "../types";

export async function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", data);
  return res.data;
}

export async function loginUser(data: { email: string; password: string }): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
}

export async function getMe(): Promise<{ user: AuthResponse["user"] }> {
  const res = await api.get("/auth/me");
  return res.data;
}

export async function verifyOtp(data: { email: string; otp: string }): Promise<{ message: string }> {
  const res = await api.post("/auth/verify-otp", data);
  return res.data;
}

export async function resendOtp(data: { email: string }): Promise<{ message: string; devOnly_otp?: string; emailSent?: boolean }> {
  const res = await api.post("/auth/resend-otp", data);
  return res.data;
}
