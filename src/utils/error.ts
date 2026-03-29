import axios from "axios";
import { ERROR_MESSAGES } from "@/constants";

interface BackendErrorPayload {
	message?: string;
	code?: string;
	error?: {
		message?: string;
		code?: string;
	};
}

export class ApiError extends Error {
	status: number;
	code?: string;
	details?: unknown;

	constructor(
		message: string,
		status = 500,
		code?: string,
		details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError;
}

function getFallbackMessage(status: number): string {
	switch (status) {
		case 401:
			return ERROR_MESSAGES.UNAUTHORIZED;
		case 403:
			return ERROR_MESSAGES.FORBIDDEN;
		case 404:
			return ERROR_MESSAGES.NOT_FOUND;
		case 429:
			return ERROR_MESSAGES.TOO_MANY_REQUESTS;
		default:
			return status >= 500
				? ERROR_MESSAGES.SERVER
				: ERROR_MESSAGES.GENERIC;
	}
}

export function parseApiError(error: unknown): ApiError {
	if (isApiError(error)) return error;

	if (axios.isAxiosError(error)) {
		const status = error.response?.status ?? 0;
		const data = error.response?.data as BackendErrorPayload | undefined;
		const code = data?.error?.code ?? data?.code;
		const backendMessage = data?.error?.message ?? data?.message;

		const message =
			backendMessage ??
			(status === 0
				? ERROR_MESSAGES.NETWORK
				: getFallbackMessage(status));

		return new ApiError(message, status, code, error.response?.data);
	}

	if (error instanceof Error) {
		return new ApiError(error.message);
	}

	return new ApiError(ERROR_MESSAGES.GENERIC);
}

export function getErrorMessage(error: unknown, fallback?: string): string {
	const parsed = parseApiError(error);
	return parsed.message || fallback || ERROR_MESSAGES.GENERIC;
}

export function withErrorHandling<TArgs extends unknown[], TResult>(
	fn: (...args: TArgs) => Promise<TResult>,
) {
	return async (...args: TArgs): Promise<TResult> => {
		try {
			return await fn(...args);
		} catch (error) {
			throw parseApiError(error);
		}
	};
}
