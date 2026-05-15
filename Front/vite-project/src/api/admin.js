const ADDRESS_API_BASE_URL = import.meta.env.VITE_ADDRESS_API_BASE_URL || 'http://localhost:8000';

// Auth
export async function adminLogin(email, password) {
  const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Login failed");
  }

  return res.json();
}

export async function adminRefresh(refreshToken) {
  const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");
  return res.json();
}

export async function adminLogout(refreshToken) {
  const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) throw new Error("Logout failed");
  return res.json();
}

export async function getAdminMe(token) {
  const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

// Products
export async function getProducts(token) {
  const response = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PRODUCTS ERROR DETAIL:", errorText);
    throw new Error(`Failed to fetch products: ${errorText}`);
  }

  return response.json();
}

export async function getProduct(token, id) {
    const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
}

export async function createProduct(token, payload) {
    const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to create product');
    }
    return res.json();
}

export async function updateProduct(token, id, payload) {
  const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error("UPDATE PRODUCT 422 DETAIL:", error);
    
    // Если FastAPI вернул массив ошибок, преобразуй в строку
    const message = Array.isArray(error.detail)
      ? error.detail.map(e => `${e.loc?.join(".")}: ${e.msg}`).join("; ")
      : error.detail || "Failed to update product";
    
    throw new Error(message);
  }

  return res.json();
}

export async function toggleProductStatus(token, id, isActive) {
    const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/products/${id}/status`, {
        method: 'PATCH',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error('Failed to toggle product status');
    return res.json();
}

export async function deleteProduct(token, id) {
    const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to delete product");
    }
    return res.json();
    }

// Orders
export async function getOrders(token, status = null) {
    const url = status
        ? `${ADDRESS_API_BASE_URL}/api/admin/orders?status=${status}`
        : `${ADDRESS_API_BASE_URL}/api/admin/orders`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
}

export async function getOrder(token, id) {
    const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
}

export async function updateOrderStatus(token, orderId, status) {
    const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
}

// Categories
export async function getCategories(token) {
    const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
}

export async function createCategory(token, payload) {
    const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/categories`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
}

export async function updateCategory(token, id, payload) {
    const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
}

export async function deleteCategory(token, id) {
    const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
}


export async function updateOrderDetails(token, orderId, payload) {
  const res = await fetch(`${ADDRESS_API_BASE_URL}/api/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    const message = Array.isArray(error.detail)
      ? error.detail.map((e) => `${e.loc?.join(".")}: ${e.msg}`).join("; ")
      : error.detail || "Failed to update order details";

    throw new Error(message);
  }

  return res.json();
}