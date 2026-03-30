import { createContext, useState } from "react";
import type { ReactNode } from "react";
import { AUTH_CONFIG } from "@/constants";
import type { User, AuthContextType } from "@/types/auth";
import { authService } from "@/services";
import { storage } from "@/utils/storage";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() =>
		storage.get<User>(AUTH_CONFIG.USER_STORAGE_KEY),
	);
	const [token, setToken] = useState<string | null>(() =>
		storage.getString(AUTH_CONFIG.TOKEN_STORAGE_KEY),
	);

	const login = (newToken: string, newRefreshToken: string, newUser: User) => {
		storage.setString(AUTH_CONFIG.TOKEN_STORAGE_KEY, newToken);
		storage.setString(
			AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY,
			newRefreshToken,
		);
		storage.set(AUTH_CONFIG.USER_STORAGE_KEY, newUser);
		setToken(newToken);
		setUser(newUser);
	};

	const logout = async () => {
		const refreshToken = storage.getString(
			AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY,
		);

		if (refreshToken) {
			try {
				await authService.logout(refreshToken);
			} catch {
				// Clear local auth state even when revoke fails.
			}
		}

		storage.removeMany([
			AUTH_CONFIG.TOKEN_STORAGE_KEY,
			AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY,
			AUTH_CONFIG.USER_STORAGE_KEY,
		]);
		setToken(null);
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{ user, token, isAuthenticated: !!token, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}
