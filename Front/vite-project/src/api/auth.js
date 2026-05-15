import { apiFetch } from "./client";

export function registerUser(payload) {
  return apiFetch("/api/auth/register", { method: "POST", body: payload });
}

export function loginUser(payload) {
  return apiFetch("/api/auth/login", { method: "POST", body: payload });
}

export function refreshTokens(refresh_token) {
  return apiFetch("/api/auth/refresh", {
    method: "POST",
    body: { refresh_token },
  });
}

export function logoutUser(refresh_token) {
  return apiFetch("/api/auth/logout", {
    method: "POST",
    body: { refresh_token },
  });
}

export function getMe(accessToken) {
  return apiFetch("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function updateMyProfile(accessToken, payload) {
  return apiFetch("/api/auth/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: payload,
  });
}