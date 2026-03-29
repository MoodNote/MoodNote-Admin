import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute() {
	const { isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return (
			<Navigate
				to={ROUTES.LOGIN}
				replace
			/>
		);
	}

	return <Outlet />;
}
