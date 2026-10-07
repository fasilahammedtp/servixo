import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { UserRole } from "../types";
import { User } from "../models/User";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(403).json({ message: "You don't have permission to access this resource" });
      return;
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    try {
      const user = await User.findById(req.user.userId).select("role hasWorkerProfile hasCustomerProfile");
      if (!user) {
        res.status(403).json({ message: "User account not found" });
        return;
      }

      if (allowedRoles.includes("worker") && user.hasWorkerProfile) {
        next();
        return;
      }

      if (allowedRoles.includes("customer") && (user.role === "customer" || user.role === "worker" || user.hasCustomerProfile)) {
        next();
        return;
      }
    } catch (error) {
      console.error("Role authorization check error:", error);
    }

    res.status(403).json({ message: "You don't have permission to access this resource" });
  };
}
