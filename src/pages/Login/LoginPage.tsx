import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import LogoWhite from "@/assets/Logo_White.png";
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
			{/* ── LEFT PANEL ── */}
			<div className="login-left">
				<div className="login-aurora login-aurora--1" />
				<div className="login-aurora login-aurora--2" />
				<div className="login-aurora login-aurora--3" />

				<div className="login-orb login-orb--joy" />
				<div className="login-orb login-orb--sadness" />
				<div className="login-orb login-orb--anger" />
				<div className="login-orb login-orb--fear" />
				<div className="login-orb login-orb--surprise" />
				<div className="login-orb login-orb--disgust" />

				<div className="login-left__content">
					<img
						src={LogoWhite}
						alt="MoodNote"
						className="login-left__logo"
					/>
					<h1 className="login-left__app-name">MoodNote</h1>
					<p className="login-left__tagline">
						Your emotional wellness command center
					</p>
					<div className="login-left__moods">
						<span className="mood-chip mood-chip--joy">Joy</span>
						<span className="mood-chip mood-chip--sadness">
							Sadness
						</span>
						<span className="mood-chip mood-chip--anger">Anger</span>
						<span className="mood-chip mood-chip--fear">Fear</span>
						<span className="mood-chip mood-chip--surprise">
							Surprise
						</span>
						<span className="mood-chip mood-chip--disgust">
							Disgust
						</span>
					</div>
				</div>

				<p className="login-left__footer">© 2025 MoodNote Admin</p>
			</div>

			{/* ── RIGHT PANEL ── */}
			<div className="login-right">
				<div className="login-right__orb login-right__orb--fear" />
				<div className="login-right__orb login-right__orb--sadness" />
				<div className="login-right__content">
					<div className="login-right__header">
						<img
							src={LogoWhite}
							alt="MoodNote"
							className="login-right__logo"
						/>
						<h2 className="login-right__title">Welcome back</h2>
						<p className="login-right__subtitle">
							Sign in to your admin account
						</p>
					</div>

					<form
						className="login-form"
						onSubmit={handleSubmit}
						noValidate>
						{error && (
							<p className="login-form__error">{error}</p>
						)}

						<div className="login-form__group">
							<label
								className="login-form__label"
								htmlFor="email">
								Email
							</label>
							<div className="login-form__input-wrapper">
								<span className="login-form__input-icon">
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round">
										<rect
											x="2"
											y="4"
											width="20"
											height="16"
											rx="2"
										/>
										<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
									</svg>
								</span>
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
						</div>

						<div className="login-form__group">
							<label
								className="login-form__label"
								htmlFor="password">
								Password
							</label>
							<div className="login-form__input-wrapper">
								<span className="login-form__input-icon">
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round">
										<rect
											x="3"
											y="11"
											width="18"
											height="11"
											rx="2"
											ry="2"
										/>
										<path d="M7 11V7a5 5 0 0 1 10 0v4" />
									</svg>
								</span>
								<input
									id="password"
									type="password"
									className="login-form__input"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									placeholder="••••••••"
									required
									autoComplete="current-password"
								/>
							</div>
						</div>

						<button
							type="submit"
							className="login-form__submit"
							disabled={loading}>
							{loading && (
								<span className="spinner" aria-hidden="true" />
							)}
							{loading ? "Signing in..." : "Sign in"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
