import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import style from "./AdminProductsPage.module.css";

const products = [
  {
    name: "LED Лампа A60 Econom",
    sku: "LED-A60-9W-E27",
    category: "Светодиодные лампы",
    price: "89 ₽",
    stock: "245",
    status: "Активен",
  },
  {
    name: "LED Лампа GU10 Spot 7W",
    sku: "LED-GU10-7W",
    category: "Светодиодные лампы",
    price: "129 ₽",
    stock: "120",
    status: "Активен",
  },
  {
    name: "LED Трубка T8 18W 1200мм",
    sku: "LED-T8-18W-1200",
    category: "Светодиодные лампы",
    price: "249 ₽",
    stock: "78",
    status: "Активен",
  },
  {
    name: "Philips Master LEDlamp 12W",
    sku: "PHILIPS-12W-E27",
    category: "Светодиодные лампы",
    price: "349 ₽",
    stock: "54",
    status: "Активен",
  },
  {
    name: "Люминесцентная TL5 28W",
    sku: "LUM-TL5-28W",
    category: "Люминесцентные",
    price: "189 ₽",
    stock: "33",
    status: "Активен",
  },
  {
    name: "Галогенная MR16 50W",
    sku: "HAL-MR16-50W",
    category: "Галогенные",
    price: "69 ₽",
    stock: "180",
    status: "Активен",
  },
  {
    name: "Умная лампа RGB Wi‑Fi E27 10W",
    sku: "SMART-RGB-E27-10W",
    category: "Умные лампы",
    price: "799 ₽",
    stock: "67",
    status: "Активен",
  },
  {
    name: "Промышленный прожектор LED 100W",
    sku: "IND-LED-100W",
    category: "Промышленные",
    price: "2 490 ₽",
    stock: "12",
    status: "Активен",
  },
];

export default function AdminProductsPage() {
  return (
    <AdminLayout title="Товары">
      <div className={style.page}>
        <div className={style.actions}>
          <button type="button" className="btn btnPrimary">
            + Добавить товар
          </button>
        </div>

        <div className={`${style.filtersCard} card`}>
          <input
            type="text"
            className={`input ${style.searchInput}`}
            placeholder="Поиск по названию..."
          />
        </div>

        <div className={`${style.tableCard} card`}>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Арт.</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  <th>Остаток</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.sku}>
                    <td className={style.productName}>{product.name}</td>
                    <td className={style.sku}>{product.sku}</td>
                    <td>{product.category}</td>
                    <td className={style.price}>{product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={style.status}>{product.status}</span>
                    </td>
                    <td>
                      <div className={style.actionsCell}>
                        <button type="button" className={style.iconButton}>
                          ✏
                        </button>
                        <button type="button" className={style.iconButton}>
                          🗑
                        </button>
                      </div>
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