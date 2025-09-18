import { useRoutes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import HeadTeacherPage from "./pages/HeadTeacherPage";
import ClassTeacherPage from "./pages/ClassTeacherPage";
import SubjectTeacherPage from "./pages/SubjectTeacherPage";
import FormMasterPage from "./pages/FormMasterPage";
import NotFoundPage from "./pages/NotFoundPage";
import NotificationDemoPage from './pages/NotificationDemoPage';
import PrivateRoute from "./components/PrivateRoute";

const Routes = () => {
  const element = useRoutes([
    { path: "/", element: <LoginPage /> },
    { path: "/admin", element: <AdminDashboardPage /> },
    { path: "/teacher", element: <TeacherDashboardPage /> },
    { path: "/teacher/head-teacher", element: <HeadTeacherPage /> },
    { path: "/teacher/class-teacher", element: <ClassTeacherPage /> },
    { path: "/teacher/subject-teacher", element: <SubjectTeacherPage /> },
    { path: "/teacher/form-master", element: <FormMasterPage /> },
    { 
      path: "/notification-demo", 
      element: (
        <PrivateRoute>
          <NotificationDemoPage />
        </PrivateRoute>
      )
    },
    { path: "*", element: <NotFoundPage /> },
  ]);

  return element;
};

export default Routes;