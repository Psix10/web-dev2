import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import style from "./AdminProductCreatePage.module.css";

export default function AdminProductCreatePage() {
  return (
    <AdminLayout title="Товары">
      <div className={style.page}>
        <a href="/admin/products" className={style.backLink}>
          ← Назад к списку
        </a>

        <h1 className={style.pageTitle}>Новый товар</h1>

        <div className={style.formLayout}>
          <div className={style.mainColumn}>
            <section className={`${style.card} card`}>
              <h2 className={style.sectionTitle}>Основное</h2>

              <div className={style.formGrid}>
                <div className={style.field}>
                  <label className={style.label}>Название *</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue="LED Лампа A60"
                  />
                </div>

                <div className={style.field}>
                  <label className={style.label}>Артикул (SKU) *</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue="LED-A60-9W-E27"
                  />
                </div>

                <div className={`${style.field} ${style.fullWidth}`}>
                  <label className={style.label}>URL изображения *</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue="https://..."
                  />
                </div>

                <div className={`${style.field} ${style.fullWidth}`}>
                  <label className={style.label}>Описание *</label>
                  <textarea
                    className="textarea"
                    defaultValue="Краткое описание..."
                  />
                </div>

                <div className={style.field}>
                  <label className={style.label}>Категория *</label>
                  <select className="input" defaultValue="">
                    <option value="" disabled>
                      Выберите...
                    </option>
                    <option>Светодиодные лампы</option>
                    <option>Люминесцентные</option>
                    <option>Галогенные</option>
                    <option>Умные лампы</option>
                    <option>Промышленные</option>
                  </select>
                </div>

                <div className={style.field}>
                  <label className={style.label}>Цена (₽) *</label>
                  <input type="number" className="input" placeholder="0" />
                </div>

                <div className={style.field}>
                  <label className={style.label}>Остаток (шт.) *</label>
                  <input
                    type="number"
                    className="input"
                    defaultValue="0"
                  />
                </div>
              </div>
            </section>

            <section className={`${style.card} card`}>
              <h2 className={style.sectionTitle}>Характеристики</h2>

              <div className={style.formGrid}>
                <div className={style.field}>
                  <label className={style.label}>Мощность *</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue="9 Вт"
                  />
                </div>

                <div className={style.field}>
                  <label className={style.label}>Напряжение *</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue="220 В"
                  />
                </div>

                <div className={style.field}>
                  <label className={style.label}>Тип цоколя *</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue="E27"
                  />
                </div>

                <div className={style.field}>
                  <label className={style.label}>Цветовая температура *</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue="4000 K"
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className={style.sideColumn}>
            <section className={`${style.card} card`}>
              <h2 className={style.sectionTitle}>Активность товара</h2>

              <label className={style.switchRow}>
                <div>
                  <p className={style.switchTitle}>Отображается ли товар в магазине</p>
                </div>

                <span className={style.switch}>
                  <span className={style.switchThumb}></span>
                </span>
              </label>

              <button type="button" className={`btn btnPrimary ${style.saveButton}`}>
                Сохранить товар
              </button>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}