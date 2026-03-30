import axios from "axios";
import type {
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
	AxiosRequestHeaders,
} from "axios";
import { API_CONFIG, AUTH_CONFIG, ROUTES } from "@/constants";
import { parseApiError } from "@/utils/error";
import { storage } from "@/utils/storage";

class ApiService {
	private client: AxiosInstance;
	private refreshPromise: Promise<string | null> | null = null;

	constructor() {
		this.client = axios.create({
			baseURL: API_CONFIG.BASE_URL,
			timeout: API_CONFIG.TIMEOUT,
			headers: {
				"Content-Type": "application/json",
			},
		});

		this.setupInterceptors();
	}

	private setupInterceptors() {
		this.client.interceptors.request.use((config) => {
			const token = storage.getString(AUTH_CONFIG.TOKEN_STORAGE_KEY);
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
			return config;
		});

		this.client.interceptors.response.use(
			(response) => response,
			async (error: unknown) => {
				const parsedError = parseApiError(error);

				if (!axios.isAxiosError(error)) {
					return Promise.reject(parsedError);
				}

				const originalRequest = error.config;
				const requestUrl = originalRequest?.url ?? "";
				const isAuthRequest =
					requestUrl.includes("/admin/auth/login") ||
					requestUrl.includes("/admin/auth/refresh") ||
					requestUrl.includes("/admin/auth/logout");

				if (
					parsedError.status === 401 &&
					originalRequest &&
					!isAuthRequest &&
					!(originalRequest as AxiosRequestConfig & { _retry?: boolean })
						._retry
				) {
					(originalRequest as AxiosRequestConfig & { _retry?: boolean })._retry =
						true;

					const refreshedToken = await this.refreshAccessToken();
					if (refreshedToken) {
						originalRequest.headers = {
							...(originalRequest.headers ?? {}),
							Authorization: `Bearer ${refreshedToken}`,
						} as AxiosRequestHeaders;

						return this.client.request(originalRequest);
					}

					this.clearAuthState();
					window.location.href = ROUTES.LOGIN;
				}

				return Promise.reject(parsedError);
			},
		);
	}

	private async refreshAccessToken(): Promise<string | null> {
		if (!this.refreshPromise) {
			this.refreshPromise = this.requestRefreshToken();
		}

		const token = await this.refreshPromise;
		this.refreshPromise = null;
		return token;
	}

	private async requestRefreshToken(): Promise<string | null> {
		const refreshToken = storage.getString(
			AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY,
		);

		if (!refreshToken) {
			return null;
		}

		try {
			const response = await this.client.post<{
				success: boolean;
				message: string;
				data: { accessToken: string; expiresIn: number };
			}>("/admin/auth/refresh", {
				refreshToken,
			});

			const newAccessToken = response.data.data.accessToken;
			storage.setString(AUTH_CONFIG.TOKEN_STORAGE_KEY, newAccessToken);
			return newAccessToken;
		} catch {
			return null;
		}
	}

	private clearAuthState() {
		storage.removeMany([
			AUTH_CONFIG.TOKEN_STORAGE_KEY,
			AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY,
			AUTH_CONFIG.USER_STORAGE_KEY,
		]);
	}

	get<T = unknown>(
		url: string,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> {
		return this.client.get<T>(url, config);
	}

	post<T = unknown, TBody = unknown>(
		url: string,
		data?: TBody,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> {
		return this.client.post<T>(url, data, config);
	}

	put<T = unknown, TBody = unknown>(
		url: string,
		data?: TBody,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> {
		return this.client.put<T>(url, data, config);
	}

	patch<T = unknown, TBody = unknown>(
		url: string,
		data?: TBody,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> {
		return this.client.patch<T>(url, data, config);
	}

	delete<T = unknown>(
		url: string,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> {
		return this.client.delete<T>(url, config);
	}
}

const api = new ApiService();

export default api;
