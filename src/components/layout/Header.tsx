import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await logout();
		navigate(ROUTES.LOGIN, { replace: true });
	};

	return (
		<header className="header">
			<div className="header__left">
				<h1 className="header__title">Admin Panel</h1>
			</div>
			<div className="header__right">
				<span className="header__user-name">
					{user?.name ?? user?.email}
				</span>
				<button
					className="header__logout-btn"
					onClick={handleLogout}>
					Logout
				</button>
			</div>
		</header>
	);
}
