export interface User {
	id: string;
	name: string;
	email: string;
	username: string;
	role: string;
}

export interface AuthContextType {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	login: (token: string, refreshToken: string, user: User) => void;
	logout: () => Promise<void>;
}

export interface AdminLoginResponse {
	success: boolean;
	message: string;
	data: {
		accessToken: string;
		refreshToken: string;
		user: User;
	};
}

export interface AdminRefreshResponse {
	success: boolean;
	message: string;
	data: {
		accessToken: string;
		expiresIn: number;
	};
}

// ── POST /admin/auth/logout ──────────────────────────────────────────────────
// Response: { success: true, message: "Admin logout successful" }
export interface AdminLogoutResponse {
	success: boolean;
	message: string;
}
