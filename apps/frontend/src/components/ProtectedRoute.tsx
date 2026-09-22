import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute: React.FC = () => {
  const { token, isLoading } = useAuth();

  if (!token && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading && !token) {
    return null;
  }

  return <Outlet />;
};
