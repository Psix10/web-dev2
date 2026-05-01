import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import style from "./AdminOrderDetailsPage.module.css";

const products = [
  {
    name: "LED Лампа A60 Econom",
    price: "89 ₽",
    qty: "5",
    total: "445 ₽",
  },
  {
    name: "Умная лампа RGB Wi-Fi E27 10W",
    price: "799 ₽",
    qty: "2",
    total: "1 598 ₽",
  },
];

export default function AdminOrderDetailsPage() {
  return (
    <AdminLayout title="Заказы">
      <div className={style.page}>
        <a href="/admin/orders" className={style.backLink}>
          ← Назад к заказам
        </a>

        <div className={style.header}>
          <div>
            <h1 className={style.pageTitle}>Заказ #1</h1>
            <p className={style.date}>11.04.2026, 09:45</p>
          </div>

          <span className={style.status}>В обработке</span>
        </div>

        <div className={style.grid}>
          <section className={`${style.card} card`}>
            <h2 className={style.sectionTitle}>Покупатель</h2>

            <div className={style.infoList}>
              <p><strong>Имя:</strong> Александр Иванов</p>
              <p><strong>Телефон:</strong> +7 (912) 345-67-89</p>
              <p><strong>Email:</strong> ivanov@example.com</p>
              <p><strong>Адрес:</strong> Москва, ул. Тверская, д. 10, кв. 25</p>
              <p><strong>Комментарий:</strong> Позвоните за час до доставки</p>
            </div>
          </section>

          <section className={`${style.card} card`}>
            <h2 className={style.sectionTitle}>Управление статусом</h2>

            <select className={`input ${style.select}`}>
              <option>В обработке</option>
              <option>Новый</option>
              <option>Отправлен</option>
              <option>Доставлен</option>
              <option>Отменен</option>
            </select>

            <p className={style.helpText}>
              Смена статуса происходит сразу
            </p>
          </section>
        </div>

        <section className={`${style.card} card`}>
          <h2 className={style.sectionTitle}>Состав заказа</h2>

          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Цена</th>
                  <th>Кол-во</th>
                  <th>Сумма</th>
                </tr>
              </thead>

              <tbody>
                {products.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.price}</td>
                    <td>{item.qty}</td>
                    <td>{item.total}</td>
                  </tr>
                ))}

                <tr className={style.totalRow}>
                  <td>Итого:</td>
                  <td></td>
                  <td></td>
                  <td>2 043 ₽</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}