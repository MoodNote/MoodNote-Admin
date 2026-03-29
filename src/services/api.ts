import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_CONFIG, AUTH_CONFIG, ROUTES } from "@/constants";
import { parseApiError } from "@/utils/error";
import { storage } from "@/utils/storage";

class ApiService {
	private client: AxiosInstance;

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
			(error: unknown) => {
				const parsedError = parseApiError(error);

				const requestUrl = axios.isAxiosError(error)
					? error.config?.url
					: undefined;
				const isLoginRequest =
					requestUrl?.includes("/admin/auth/login");

				if (parsedError.status === 401 && !isLoginRequest) {
					this.clearAuthState();
					window.location.href = ROUTES.LOGIN;
				}

				return Promise.reject(parsedError);
			},
		);
	}

	private clearAuthState() {
		storage.removeMany([
			AUTH_CONFIG.TOKEN_STORAGE_KEY,
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
