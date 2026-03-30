import api from "./api";
import type {
	UsersResponse,
	UserDetailResponse,
	UserStatusResponse,
} from "@/types/user";
import { withErrorHandling } from "@/utils/error";

export interface UsersQueryParams {
	page: number;
	limit: number;
	search?: string;
	isActive?: "true" | "false";
	createdFrom?: string;
	createdTo?: string;
	entryCountMin?: string;
	entryCountMax?: string;
}

class UsersService {
	getUsers = withErrorHandling(async (params: UsersQueryParams) => {
		const { data } = await api.get<UsersResponse>("/admin/users", {
			params,
		});
		return data.data;
	});

	getUserDetail = withErrorHandling(async (userId: string) => {
		const { data } = await api.get<UserDetailResponse>(
			`/admin/users/${userId}`,
		);
		return data.data.user;
	});

	updateUserStatus = withErrorHandling(
		async (userId: string, isActive: boolean, reason?: string) => {
			const { data } = await api.patch<
				UserStatusResponse,
				{ isActive: boolean; reason?: string }
			>(`/admin/users/${userId}/status`, {
				isActive,
				reason,
			});

			return data.data;
		},
	);
}

export const usersService = new UsersService();
