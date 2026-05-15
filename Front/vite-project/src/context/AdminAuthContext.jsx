import { createContext, useContext, useEffect, useState } from "react";
import {
    adminLogin,
    adminRefresh,
    adminLogout,
    getAdminMe,
} from "../api/admin";

const AdminAuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";
const ADMIN_KEY = "admin_profile";

export function AdminAuthProvider({ children }) {
    const [admin, setAdmin] = useState(() => {
        const stored = localStorage.getItem(ADMIN_KEY);
        return stored ? JSON.parse(stored) : null;
    });

    const [accessToken, setAccessToken] = useState(() => {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    });

    const [refreshToken, setRefreshToken] = useState(() => {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAdmin = async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            const adminData = await getAdminMe(accessToken);
            setAdmin(adminData);
            localStorage.setItem(ADMIN_KEY, JSON.stringify(adminData));
        } catch (error) {
            try {
            if (!refreshToken) {
                throw error;
            }

            const tokens = await adminRefresh(refreshToken);

            setAccessToken(tokens.access_token);
            setRefreshToken(tokens.refresh_token);

            localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);

            const adminData = await getAdminMe(tokens.access_token);
            setAdmin(adminData);
            localStorage.setItem(ADMIN_KEY, JSON.stringify(adminData));
            } catch {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(ADMIN_KEY);

            setAccessToken(null);
            setRefreshToken(null);
            setAdmin(null);
            }
        } finally {
            setLoading(false);
        }
        };

        initAdmin();
    }, [accessToken, refreshToken]);

    const login = async (email, password) => {
        const tokens = await adminLogin(email, password);

        setAccessToken(tokens.access_token);
        setRefreshToken(tokens.refresh_token);

        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);

        const adminData = await getAdminMe(tokens.access_token);
        setAdmin(adminData);
        localStorage.setItem(ADMIN_KEY, JSON.stringify(adminData));
    };

    const logout = async () => {
        try {
        if (refreshToken) {
            await adminLogout(refreshToken);
        }
        } catch (error) {
        console.error("Logout failed:", error);
        } finally {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(ADMIN_KEY);

        setAccessToken(null);
        setRefreshToken(null);
        setAdmin(null);
        }
    };

    return (
        <AdminAuthContext.Provider
        value={{
            admin,
            accessToken,
            refreshToken,
            login,
            logout,
            loading,
        }}
        >
        {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext);

    if (!context) {
        throw new Error("useAdminAuth must be used within AdminAuthProvider");
    }

    return context;
}