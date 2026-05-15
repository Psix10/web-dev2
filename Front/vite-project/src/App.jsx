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
import AdminProtectedRoute from "./components/AdminProtectedRoute/AdminProtectedRoute";
import { AdminAuthProvider } from "./context/AdminAuthContext";

export default function App() {
  return (
    <AdminAuthProvider>
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

        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminProtectedRoute>
              <AdminProductsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <AdminProtectedRoute>
              <AdminProductCreatePage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:id/edit"
          element={
            <AdminProtectedRoute>
              <AdminProductCreatePage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminProtectedRoute>
              <AdminOrdersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <AdminProtectedRoute>
              <AdminOrderDetailsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminProtectedRoute>
              <AdminCategoriesPage />
            </AdminProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}