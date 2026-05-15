const ADDRESS_API_BASE_URL = import.meta.env.VITE_ADDRESS_API_BASE_URL || 'http://localhost:8000';

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

    async function orderFetch(path, options = {}) {
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
        let message;

        // Для 5xx ошибок показываем дружелюбное сообщение
        if (response.status >= 500) {
        console.error("SERVER ERROR:", {
            status: response.status,
            url: `${ADDRESS_API_BASE_URL}${path}`,
            detail: data?.detail,
            data,
        });
        message = "Ошибка сервера. Попробуйте ещё раз позже.";
        } else if (response.status === 422) {
        message = formatErrorDetail(data?.detail) || "Некорректные данные запроса";
        } else if (response.status === 401) {
        message = "Необходимо войти в систему";
        } else if (response.status === 403) {
        message = "Недостаточно прав для выполнения действия";
        } else {
        message =
            formatErrorDetail(data?.detail) ||
            data?.message ||
            response.statusText ||
            "Request failed";
        }

        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

export function createOrder(payload, accessToken = null) {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

    return orderFetch("/api/orders", {
        method: "POST",
        headers,
        body: payload,
    });
}

export function getMyOrders(accessToken) {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

    return orderFetch("/api/orders/me", {
        method: "GET",
        headers,
    });
}