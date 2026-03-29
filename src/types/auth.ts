export interface User {
	id: string;
	name: string;
	email: string;
	role: string;
}

export interface AuthContextType {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	login: (token: string, user: User) => void;
	logout: () => void;
}

export interface AdminLoginResponse {
	success: boolean;
	message: string;
	data: {
		accessToken: string;
		user: User;
	};
}
