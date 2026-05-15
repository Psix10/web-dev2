import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { getOrders } from "../../api/admin";
import style from "./AdminOrdersPage.module.css";

export default function AdminOrdersPage() {
  const { accessToken } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getOrders(accessToken, statusFilter || null);
        setOrders(data);
      } catch (err) {
        setError("Ошибка загрузки заказов");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [accessToken, statusFilter]);

  const getNormalizedStatus = (status) => {
    return String(status || "").trim().toUpperCase();
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

  if (loading) {
    return (
      <AdminLayout title="Заказы">
        <p>Загрузка...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Заказы">
        <p style={{ color: "red" }}>{error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Заказы">
      <div className={style.page}>
        <div className={style.topbar}>
          <select
            className={`input ${style.filter}`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="PENDING">Новый</option>
            <option value="CONFIRMED">Подтверждён</option>
            <option value="PROCESSING">В обработке</option>
            <option value="SHIPPED">Отправлен</option>
            <option value="DELIVERED">Доставлен</option>
            <option value="CANCELLED">Отменён</option>
          </select>
        </div>

        <div className={`${style.tableCard} card`}>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Покупатель</th>
                  <th>Дата</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>
                      Заказы не найдены
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td className={style.orderId}>#{order.id}</td>

                      <td>
                        <div className={style.customerBlock}>
                          <span className={style.customerName}>
                            {order.customer_name || order.customerName || "—"}
                          </span>
                          <span className={style.customerEmail}>
                            {order.customer_email || order.customerEmail || "—"}
                          </span>
                        </div>
                      </td>

                      <td className={style.date}>
                        {new Date(
                          order.created_at || order.createdAt
                        ).toLocaleString("ru-RU")}
                      </td>

                      <td className={style.amount}>
                        {order.total_amount || order.totalAmount} ₽
                      </td>

                      <td>
                        <span className={`${style.status} ${getStatusClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>

                      <td>
                        <Link to={`/admin/orders/${order.id}`} className={style.openLink}>
                          Открыть →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}