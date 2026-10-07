import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user) {
    const hasDirectRole = allowedRoles.includes(user.role);
    const hasWorkerPermission = allowedRoles.includes("worker") && Boolean(user.hasWorkerProfile);
    const hasCustomerPermission =
      allowedRoles.includes("customer") &&
      (user.role === "customer" || user.role === "worker" || Boolean(user.hasCustomerProfile));

    if (!hasDirectRole && !hasWorkerPermission && !hasCustomerPermission) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
