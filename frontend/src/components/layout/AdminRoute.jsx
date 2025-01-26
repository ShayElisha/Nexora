// src/components/layout/AdminRoute.js
import { Navigate, Outlet } from "react-router-dom";

function AdminRoute({ authUser }) {
  // אם המשתמש לא קיים או role שלו לא "Admin", מפנים אותו לדף הראשי.
  if (!authUser || authUser.user.role !== "Admin") {
    return <Navigate to="/" />;
  }

  // אחרת, מציגים את ה-Outlet של ה-Routes הפנימיים.
  return <Outlet />;
}

export default AdminRoute;
