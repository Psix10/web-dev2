import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage/HomePage";
import CatalogPage from "./pages/CatalogPage/CatalogPage";
import ProductPage from "./pages/ProductPage/ProductPage";
import CartPage from "./pages/CartPage/CartPage";
import CheckoutPage from "./pages/CheckoutPage/CheckoutPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import AccountPage from "./pages/AccountPage/AccountPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";

import AdminLoginPage from "./pages/AdminLoginPage/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage/AdminDashboardPage";
import AdminProductsPage from "./pages/AdminProductsPage/AdminProductsPage";
import AdminProductCreatePage from "./pages/AdminProductCreatePage/AdminProductCreatePage";
import AdminOrdersPage from "./pages/AdminOrdersPage/AdminOrdersPage";
import AdminOrderDetailsPage from "./pages/AdminOrderDetailsPage/AdminOrderDetailsPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage/AdminCategoriesPage";

import RequireAuth from "./components/RequireAuth/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/checkout"
        element={
          <RequireAuth>
            <CheckoutPage />
          </RequireAuth>
        }
      />

      <Route
        path="/account"
        element={
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        }
      />

      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/products" element={<AdminProductsPage />} />
      <Route path="/admin/products/new" element={<AdminProductCreatePage />} />
      <Route path="/admin/orders" element={<AdminOrdersPage />} />
      <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
      <Route path="/admin/categories" element={<AdminCategoriesPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}