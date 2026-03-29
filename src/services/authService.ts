import api from "./api";
import type { AdminLoginResponse } from "@/types/auth";
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
}

export const authService = new AuthService();
