import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/pages/Login/LoginPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import UsersPage from "@/pages/Users/UsersPage";
import NotificationsPage from "@/pages/Notifications/NotificationsPage";
import MusicPage from "@/pages/Music/MusicPage";
import NotFoundPage from "@/pages/NotFound/NotFoundPage";

const router = createBrowserRouter([
	{
		path: ROUTES.LOGIN,
		element: <LoginPage />,
	},
	{
		element: <ProtectedRoute />,
		children: [
			{
				element: <MainLayout />,
				children: [
					{
						index: true,
						element: (
							<Navigate
								to={ROUTES.DASHBOARD}
								replace
							/>
						),
					},
					{
						path: "dashboard",
						element: <DashboardPage />,
					},
					{
						path: "users",
						element: <UsersPage />,
					},
					{
						path: "notifications",
						element: <NotificationsPage />,
					},
					{
						path: "music",
						element: <MusicPage />,
					},
				],
			},
		],
	},
	{
		path: "*",
		element: <NotFoundPage />,
	},
]);

export default router;
