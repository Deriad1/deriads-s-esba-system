import { useRoutes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

const ProjectRoutes = () => {
  const element = useRoutes([
    { path: "/", element: <LoginPage /> },
    { path: "/admin", element: <AdminDashboardPage /> },
    { path: "/teacher", element: <TeacherDashboardPage /> },
    { path: "*", element: <NotFoundPage /> },
  ]);

  return element;
};

export default ProjectRoutes;
