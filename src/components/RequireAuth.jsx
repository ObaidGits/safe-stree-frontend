import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthGate = ({ canAccess, redirectTo, children }) => {
  const { isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!canAccess) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return children;
};

export const RequireUserAuth = ({ children }) => {
  const { isUser } = useAuth();

  return (
    <AuthGate canAccess={isUser} redirectTo="/login">
      {children}
    </AuthGate>
  );
};

export const RequireAdminAuth = ({ children }) => {
  const { isAdmin } = useAuth();

  return (
    <AuthGate canAccess={isAdmin} redirectTo="/admin/login">
      {children}
    </AuthGate>
  );
};
