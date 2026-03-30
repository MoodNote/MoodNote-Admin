import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services";
import { getErrorMessage, isApiError } from "@/utils/error";
import "./LoginPage.css";

export default function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		if (!email.trim() || !password) {
			setError("Email and password are required.");
			return;
		}

		setLoading(true);

		try {
			const data = await authService.login(email, password);
			login(data.accessToken, data.refreshToken, data.user);
			navigate(ROUTES.DASHBOARD, { replace: true });
		} catch (error: unknown) {
			if (isApiError(error)) {
				if (error.status === 403) {
					setError("This account does not have admin access.");
				} else if (error.status === 429) {
					setError(
						"Too many login attempts. Please wait and try again.",
					);
				} else {
					setError(
						error.message ||
							"Invalid email or password. Please try again.",
					);
				}
			} else {
				setError(
					getErrorMessage(error, "Login failed. Please try again."),
				);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="login-page">
			<div className="login-card">
				<div className="login-card__header">
					<span className="login-card__logo">🎵</span>
					<h1 className="login-card__title">MoodNote Admin</h1>
					<p className="login-card__subtitle">
						Sign in to your account
					</p>
				</div>

				<form
					className="login-form"
					onSubmit={handleSubmit}
					noValidate>
					{error && <p className="login-form__error">{error}</p>}

					<div className="login-form__group">
						<label
							className="login-form__label"
							htmlFor="email">
							Email
						</label>
						<input
							id="email"
							type="email"
							className="login-form__input"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="admin@example.com"
							required
							autoComplete="email"
						/>
					</div>

					<div className="login-form__group">
						<label
							className="login-form__label"
							htmlFor="password">
							Password
						</label>
						<input
							id="password"
							type="password"
							className="login-form__input"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							required
							autoComplete="current-password"
						/>
					</div>

					<button
						type="submit"
						className="login-form__submit"
						disabled={loading}>
						{loading ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}
