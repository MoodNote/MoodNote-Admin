import api from "./api";
import type { UsersResponse } from "@/types/user";
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
}

export const usersService = new UsersService();
