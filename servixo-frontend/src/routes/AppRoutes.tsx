import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import VerifyOtp from "../pages/auth/VerifyOtp";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import CustomerHome from "../pages/customer/Home";
import Services from "../pages/customer/Services";
import CustomerCreateRequest from "../pages/customer/CreateRequest";
import JobDetail from "../pages/customer/JobDetail";
import JobHistory from "../pages/customer/JobHistory";
import CustomerProfile from "../pages/customer/Profile";
import WorkerHome from "../pages/worker/Home";
import WorkerProfileSetup from "../pages/worker/ProfileSetup";
import WorkerProfile from "../pages/worker/Profile";
import WorkerMyJobs from "../pages/worker/MyJobs";
import Landing from "../pages/landing/Landing";
import Terms from "../pages/legal/Terms";
import Privacy from "../pages/legal/Privacy";
import BecomeWorker from "../pages/customer/BecomeWorker";
import Admin from "../pages/admin/Admin";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { CustomerLayout } from "../components/CustomerLayout";
import Messages from "../pages/shared/Messages";

export default function AppRoutes() {
  return (
    <Routes>

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={<Landing />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      <Route
        path="/become-worker"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <BecomeWorker />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<CustomerHome />} />
        <Route path="/services" element={<Services />} />
        <Route path="/home/create-request" element={<CustomerCreateRequest />} />
        <Route path="/home/jobs/:id" element={<JobDetail />} />
        <Route path="/home/history" element={<JobHistory />} />
        <Route path="/home/profile" element={<CustomerProfile />} />
        <Route path="/home/messages" element={<Messages portal="customer" />} />
      </Route>

      <Route
        path="/worker"
        element={
          <ProtectedRoute allowedRoles={["worker"]}>
            <WorkerHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/my-jobs"
        element={
          <ProtectedRoute allowedRoles={["worker"]}>
            <WorkerMyJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/messages"
        element={
          <ProtectedRoute allowedRoles={["worker"]}>
            <Messages portal="worker" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/profile"
        element={
          <ProtectedRoute allowedRoles={["worker"]}>
            <WorkerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/profile-setup"
        element={
          <ProtectedRoute allowedRoles={["worker"]}>
            <WorkerProfileSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route path="/verify-otp" element={<VerifyOtp />} />
    </Routes>
  );
}
