const ADDRESS_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function formatErrorDetail(detail) {
    if (!detail) {
        return "Произошла ошибка запроса";
    }

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
        .map((item) => {
            if (typeof item === "string") {
            return item;
            }

            if (item?.msg) {
            const location = Array.isArray(item.loc)
                ? item.loc.slice(1).join(".")
                : "";

            return location ? `${location}: ${item.msg}` : item.msg;
            }

            return JSON.stringify(item);
        })
        .join("; ");
    }

    if (typeof detail === "object") {
        if (detail.message && typeof detail.message === "string") {
        return detail.message;
        }

        if (detail.error && typeof detail.error === "string") {
        return detail.error;
        }

        return Object.entries(detail)
        .map(([key, value]) => {
            if (Array.isArray(value)) {
            return `${key}: ${value.join(", ")}`;
            }

            if (typeof value === "object" && value !== null) {
            return `${key}: ${JSON.stringify(value)}`;
            }

            return `${key}: ${value}`;
        })
        .join("; ");
    }

    return "Произошла ошибка запроса";
}

async function addressFetch(path, options = {}) {
    const headers = {
        ...(options.headers || {}),
    };

    let body = options.body;

    if (body !== undefined && body !== null && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
    }

    const response = await fetch(`${ADDRESS_API_BASE_URL}${path}`, {
        ...options,
        headers,
        body,
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const message =
        formatErrorDetail(data?.detail) ||
        data?.message ||
        response.statusText ||
        "Request failed";

        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

export function getUserAddresses(accessToken) {
    return addressFetch("/api/users/me/addresses", {
        method: "GET",
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });
}

export function createUserAddress(payload, accessToken) {
    return addressFetch("/api/users/me/addresses", {
        method: "POST",
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
    });
}

export function updateUserAddress(addressId, payload, accessToken) {
    return addressFetch(`/api/users/me/addresses/${addressId}`, {
        method: "PATCH",
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
    });
}

export function deleteUserAddress(addressId, accessToken) {
    return addressFetch(`/api/users/me/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });
}

export function setDefaultUserAddress(addressId, accessToken) {
    return addressFetch(`/api/users/me/addresses/${addressId}/default`, {
        method: "PATCH",
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });
}