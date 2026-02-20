import { Navigate } from "react-router-dom";
import { getStoredUser } from "@/lib/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
