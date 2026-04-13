import api from "./api";
import type {
	AdminLoginResponse,
	AdminRefreshResponse,
	AdminLogoutResponse,
} from "@/types/auth";
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
		const { data } = await api.post<AdminLogoutResponse>(
			"/admin/auth/logout",
			{ refreshToken },
		);
		return data;
	});
}

export const authService = new AuthService();
