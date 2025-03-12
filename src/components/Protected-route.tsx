import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/services/api/authContext";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Visa en laddningsindikator eller returnera null
    return <div>Laddar...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
