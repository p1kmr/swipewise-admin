import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { ROUTES } from "../constants/routes.js";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Wait for the stored session token to be validated before deciding.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-light-bg dark:bg-surface-dark-bg">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
