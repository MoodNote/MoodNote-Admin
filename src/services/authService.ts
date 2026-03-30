import api from "./api";
import type { AdminLoginResponse, AdminRefreshResponse } from "@/types/auth";
import { withErrorHandling } from "@/utils/error";

class AuthService {
	login = withErrorHandling(async (email: string, password: string) => {
		const { data } = await api.post<AdminLoginResponse>(
			"/admin/auth/login",
			{
				email,
				password,
			},
		);

		return data.data;
	});

	refreshToken = withErrorHandling(async (refreshToken: string) => {
		const { data } = await api.post<AdminRefreshResponse>(
			"/admin/auth/refresh",
			{ refreshToken },
		);

		return data.data;
	});

	logout = withErrorHandling(async (refreshToken: string) => {
		await api.post("/admin/auth/logout", { refreshToken });
	});
}

export const authService = new AuthService();
