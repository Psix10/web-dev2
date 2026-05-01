import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import style from "./AdminDashboardPage.module.css";

const stats = [
  {
    id: 1,
    value: "26 453 ₽",
    label: "Выручка (общая)",
  },
  {
    id: 2,
    value: "1",
    label: "Новых заказов",
  },
  {
    id: 3,
    value: "8",
    label: "Активных товаров",
  },
  {
    id: 4,
    value: "3",
    label: "Всего заказов",
  },
];

const latestOrders = [
  {
    id: "#1",
    customer: "Александр Иванов",
    date: "11.04.2026, 09:45",
    amount: "2 043 ₽",
    status: "В обработке",
  },
  {
    id: "#2",
    customer: "Мария Петрова",
    date: "11.04.2026, 09:45",
    amount: "6 980 ₽",
    status: "Новый",
  },
  {
    id: "#3",
    customer: "ООО ТехноСвет",
    date: "11.04.2026, 09:45",
    amount: "17 430 ₽",
    status: "Отправлен",
  },
];

const lowStock = [
  {
    title: "Промышленный прожектор LED 100W",
    sku: "IND-LED-100W",
    stock: "12 шт.",
  },
];

export default function AdminDashboardPage() {
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
              <a href="/admin/orders" className={style.panelLink}>
                Все заказы
              </a>
            </div>

            <div className={style.orderList}>
              {latestOrders.map((order) => (
                <div key={order.id} className={style.orderItem}>
                  <div className={style.orderMain}>
                    <p className={style.orderCustomer}>
                      {order.id} — {order.customer}
                    </p>
                    <p className={style.orderDate}>{order.date}</p>
                  </div>

                  <div className={style.orderMeta}>
                    <span className={style.orderAmount}>{order.amount}</span>
                    <span
                      className={`${style.status} ${
                        order.status === "Новый"
                          ? style.statusNew
                          : order.status === "Отправлен"
                          ? style.statusSent
                          : style.statusProcessing
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${style.panel} card`}>
            <div className={style.panelHeader}>
              <h3 className={style.panelTitle}>Низкий остаток</h3>
              <a href="/admin/products" className={style.panelLink}>
                Все товары
              </a>
            </div>

            <div className={style.lowStockList}>
              {lowStock.map((item) => (
                <div key={item.sku} className={style.lowStockItem}>
                  <div>
                    <p className={style.lowStockTitle}>{item.title}</p>
                    <p className={style.lowStockSku}>{item.sku}</p>
                  </div>

                  <span className={style.lowStockCount}>{item.stock}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}