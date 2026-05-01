import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import style from "./AdminOrdersPage.module.css";

const orders = [
  {
    id: "#1",
    customer: "Александр Иванов",
    email: "ivanov@example.com",
    date: "11.04.2026, 09:45",
    amount: "2 043 ₽",
    status: "В обработке",
  },
  {
    id: "#2",
    customer: "Мария Петрова",
    email: "petrova@example.com",
    date: "11.04.2026, 09:45",
    amount: "6 980 ₽",
    status: "Новый",
  },
  {
    id: "#3",
    customer: "ООО ТехноСвет",
    email: "order@technosvet.ru",
    date: "11.04.2026, 09:45",
    amount: "17 430 ₽",
    status: "Отправлен",
  },
];

export default function AdminOrdersPage() {
  return (
    <AdminLayout title="Заказы">
      <div className={style.page}>
        <div className={style.topbar}>
          <select className={`input ${style.filter}`}>
            <option>Все статусы</option>
            <option>Новый</option>
            <option>В обработке</option>
            <option>Отправлен</option>
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
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className={style.orderId}>{order.id}</td>

                    <td>
                      <div className={style.customerBlock}>
                        <span className={style.customerName}>{order.customer}</span>
                        <span className={style.customerEmail}>{order.email}</span>
                      </div>
                    </td>

                    <td className={style.date}>{order.date}</td>
                    <td className={style.amount}>{order.amount}</td>

                    <td>
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
                    </td>

                    <td>
                      <a href="/admin/orders/1" className={style.openLink}>
                        Открыть →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}