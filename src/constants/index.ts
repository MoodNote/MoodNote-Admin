export const API_CONFIG = {
	BASE_URL: import.meta.env.VITE_API_URL ?? "/api",
	TIMEOUT: 30000,
};

export const AUTH_CONFIG = {
	TOKEN_STORAGE_KEY: "token",
	USER_STORAGE_KEY: "user",
};

export const ROUTES = {
	LOGIN: "/login",
	DASHBOARD: "/dashboard",
	USERS: "/users",
	MUSIC: "/music",
	NOTIFICATIONS: "/notifications",
} as const;

export const ERROR_MESSAGES = {
	NETWORK: "Network error. Please check your connection and try again.",
	UNAUTHORIZED: "Your session has expired. Please sign in again.",
	FORBIDDEN: "You do not have permission to perform this action.",
	NOT_FOUND: "Requested resource was not found.",
	TOO_MANY_REQUESTS: "Too many requests. Please wait and try again.",
	SERVER: "Server error. Please try again later.",
	GENERIC: "Something went wrong. Please try again.",
};
