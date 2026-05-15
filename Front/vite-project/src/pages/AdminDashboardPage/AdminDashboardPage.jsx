import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { getOrders, getProducts } from "../../api/admin";
import style from "./AdminDashboardPage.module.css";

export default function AdminDashboardPage() {
  const { accessToken } = useAdminAuth();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const [ordersData, productsData] = await Promise.all([
          getOrders(accessToken),
          getProducts(accessToken),
        ]);

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки данных дашборда");
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchDashboardData();
    }
  }, [accessToken]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("ru-RU").format(Number(value || 0)) + " ₽";
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("ru-RU");
  };

  const getNormalizedStatus = (status) => {
    return String(status || "").trim().toUpperCase();
  };

  const getStatusLabel = (status) => {
    const normalized = getNormalizedStatus(status);

    const labels = {
      NEW: "Новый",
      PENDING: "Новый",
      CONFIRMED: "Подтверждён",
      PROCESSING: "В обработке",
      SHIPPED: "Отправлен",
      DELIVERED: "Доставлен",
      CANCELLED: "Отменён",
    };

    return labels[normalized] || status || "—";
  };

  const getStatusClass = (status) => {
    const normalized = getNormalizedStatus(status);

    if (normalized === "NEW" || normalized === "PENDING") {
      return style.statusPending;
    }

    if (normalized === "CONFIRMED") {
      return style.statusConfirmed;
    }

    if (normalized === "PROCESSING") {
      return style.statusProcessing;
    }

    if (normalized === "SHIPPED") {
      return style.statusShipped;
    }

    if (normalized === "DELIVERED") {
      return style.statusDelivered;
    }

    if (normalized === "CANCELLED") {
      return style.statusCancelled;
    }

    return style.statusPending;
  };

  const totalRevenue = useMemo(() => {
    return orders.reduce(
      (sum, order) => sum + Number(order.total_amount || order.totalAmount || 0),
      0
    );
  }, [orders]);

  const newOrdersCount = useMemo(() => {
    return orders.filter((order) => {
      const normalized = getNormalizedStatus(order.status);
      return normalized === "NEW" || normalized === "PENDING";
    }).length;
  }, [orders]);

  const activeProductsCount = useMemo(() => {
    return products.filter(
      (product) => product.is_active === true || product.isActive === true
    ).length;
  }, [products]);

  const latestOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b.created_at || b.createdAt) -
          new Date(a.created_at || a.createdAt)
      )
      .slice(0, 5);
  }, [orders]);

  const lowStock = useMemo(() => {
    return [...products]
      .filter((product) => {
        const stock = Number(product.stock_quantity ?? product.stockQty ?? 0);
        return stock > 0 && stock <= 12;
      })
      .sort(
        (a, b) =>
          Number(a.stock_quantity ?? a.stockQty ?? 0) -
          Number(b.stock_quantity ?? b.stockQty ?? 0)
      )
      .slice(0, 5);
  }, [products]);

  const stats = [
    {
      id: 1,
      value: formatCurrency(totalRevenue),
      label: "Выручка (общая)",
    },
    {
      id: 2,
      value: String(newOrdersCount),
      label: "Новых заказов",
    },
    {
      id: 3,
      value: String(activeProductsCount),
      label: "Активных товаров",
    },
    {
      id: 4,
      value: String(orders.length),
      label: "Всего заказов",
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Дашборд">
        <div className={style.dashboard}>
          <p>Загрузка...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Дашборд">
        <div className={style.dashboard}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Дашборд">
      <div className={style.dashboard}>
        <section className={style.statsGrid}>
          {stats.map((item) => (
            <article key={item.id} className={`${style.statCard} card`}>
              <div className={style.statValue}>{item.value}</div>
              <div className={style.statLabel}>{item.label}</div>
            </article>
          ))}
        </section>

        <section className={style.contentGrid}>
          <div className={`${style.panel} card`}>
            <div className={style.panelHeader}>
              <h3 className={style.panelTitle}>Последние заказы</h3>
              <Link to="/admin/orders" className={style.panelLink}>
                Все заказы
              </Link>
            </div>

            <div className={style.orderList}>
              {latestOrders.length === 0 ? (
                <p>Заказов пока нет</p>
              ) : (
                latestOrders.map((order) => (
                  <div key={order.id} className={style.orderItem}>
                    <div className={style.orderMain}>
                      <p className={style.orderCustomer}>
                        #{order.id} —{" "}
                        {order.customer_name ||
                          order.customerName ||
                          order.customer_email ||
                          order.customerEmail ||
                          "Без имени"}
                      </p>
                      <p className={style.orderDate}>
                        {formatDate(order.created_at || order.createdAt)}
                      </p>
                    </div>

                    <div className={style.orderMeta}>
                      <span className={style.orderAmount}>
                        {formatCurrency(order.total_amount || order.totalAmount)}
                      </span>
                      <span
                        className={`${style.status} ${getStatusClass(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`${style.panel} card`}>
            <div className={style.panelHeader}>
              <h3 className={style.panelTitle}>Низкий остаток</h3>
              <Link to="/admin/products" className={style.panelLink}>
                Все товары
              </Link>
            </div>

            <div className={style.lowStockList}>
              {lowStock.length === 0 ? (
                <p>Нет товаров с низким остатком</p>
              ) : (
                lowStock.map((item) => (
                  <div key={item.id || item.sku} className={style.lowStockItem}>
                    <div>
                      <p className={style.lowStockTitle}>{item.name}</p>
                      <p className={style.lowStockSku}>{item.sku}</p>
                    </div>

                    <span className={style.lowStockCount}>
                      {item.stock_quantity ?? item.stockQty ?? 0} шт.
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}