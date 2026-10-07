export type UserRole = "customer" | "worker" | "admin";

export type JobStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "on_the_way"
  | "arrived"
  | "working"
  | "completed"
  | "cancelled";

export type QuotationStatus = "pending" | "accepted" | "rejected";

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
