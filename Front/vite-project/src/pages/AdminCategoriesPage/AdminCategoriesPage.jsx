import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import style from "./AdminCategoriesPage.module.css";

const categories = [
  {
    name: "Светодиодные лампы",
    slug: "led",
    description: "Энергоэффективные LED лампы",
  },
  {
    name: "Люминесцентные",
    slug: "fluorescent",
    description: "Люминесцентные лампы",
  },
  {
    name: "Галогенные",
    slug: "halogen",
    description: "Галогенные лампы",
  },
  {
    name: "Умные лампы",
    slug: "smart",
    description: "Лампы с управлением через приложение",
  },
  {
    name: "Промышленные",
    slug: "industrial",
    description: "Лампы для промышленных нужд",
  },
];

export default function AdminCategoriesPage() {
  return (
    <AdminLayout title="Категории">
      <div className={style.page}>
        <div className={style.actions}>
          <button type="button" className="btn btnPrimary">
            + Добавить
          </button>
        </div>

        <div className={`${style.tableCard} card`}>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Slug</th>
                  <th>Описание</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr key={category.slug}>
                    <td className={style.name}>{category.name}</td>
                    <td className={style.slug}>{category.slug}</td>
                    <td className={style.description}>{category.description}</td>
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