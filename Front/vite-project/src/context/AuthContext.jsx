import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, loginUser, logoutUser, refreshTokens } from "../api/auth";

const AuthContext = createContext(null);

function mapUser(user) {
    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        firstName: user.first_name ?? "",
        lastName: user.last_name ?? "",
        name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
        phone: user.phone || "",
        isActive: user.is_active,
        isVerified: user.is_verified,
    };
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(() => {
        const saved = localStorage.getItem("auth_tokens");
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);

    const refreshUser = async (accessTokenArg) => {
        const accessToken = accessTokenArg || tokens?.access_token;
        if (!accessToken) return null;

        const me = await getMe(accessToken);
        const mappedUser = mapUser(me);
        setUser(mappedUser);
        return mappedUser;
    };

    useEffect(() => {
        async function restoreSession() {
        if (!tokens?.access_token) {
            setLoading(false);
            return;
        }

        try {
            await refreshUser(tokens.access_token);
        } catch (error) {
            if (!tokens?.refresh_token) {
            setUser(null);
            setTokens(null);
            localStorage.removeItem("auth_tokens");
            setLoading(false);
            return;
            }

            try {
            const newTokens = await refreshTokens(tokens.refresh_token);
            setTokens(newTokens);
            localStorage.setItem("auth_tokens", JSON.stringify(newTokens));

            await refreshUser(newTokens.access_token);
            } catch {
            setUser(null);
            setTokens(null);
            localStorage.removeItem("auth_tokens");
            } finally {
            setLoading(false);
            }

            return;
        }

        setLoading(false);
        }

        restoreSession();
    }, [tokens?.access_token, tokens?.refresh_token]);

    const login = async (credentials) => {
        const response = await loginUser(credentials);

        const mappedUser = mapUser(response.user);
        setUser(mappedUser);
        setTokens(response.tokens);
        localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));

        return mappedUser;
    };

    const logout = async () => {
        try {
        if (tokens?.refresh_token) {
            await logoutUser(tokens.refresh_token);
        }
        } catch {
        } finally {
        setUser(null);
        setTokens(null);
        localStorage.removeItem("auth_tokens");
        }
    };

    const value = useMemo(
        () => ({
        user,
        tokens,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        }),
        [user, tokens, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
    }