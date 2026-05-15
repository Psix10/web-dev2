
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

async function productFetch(path, options = {}) {
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

export function getProducts(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.category) queryParams.set("category", params.category);
    if (params.minPrice) queryParams.set("min_price", params.minPrice);
    if (params.maxPrice) queryParams.set("max_price", params.maxPrice);
    if (params.baseType) queryParams.set("base_type", params.baseType);
    if (params.wattage) queryParams.set("wattage", params.wattage);
    if (params.colorTemperature) {
        queryParams.set("color_temperature", params.colorTemperature);
    }
    if (params.page) queryParams.set("page", params.page);
    if (params.size) queryParams.set("size", params.size);

    const query = queryParams.toString();
    const path = query ? `/api/products?${query}` : "/api/products";

    return productFetch(path, {
        method: "GET",
    });
}

export function getProductById(productId) {
    return productFetch(`/api/products/${productId}`, {
        method: "GET",
    });
}

export function getProductBySlug(slug) {
    return productFetch(`/api/products/slug/${slug}`, {
        method: "GET",
    });
    }

export function getCategories() {
    return productFetch("/api/categories", {
        method: "GET",
    });
}