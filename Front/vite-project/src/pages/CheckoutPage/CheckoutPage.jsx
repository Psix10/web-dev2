import React, { useState } from "react";
import StoreLayout from "../../layouts/StoreLayout";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import style from "./CheckoutPage.module.css";
import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    comment: "",
  });

  const handleChange = (field) => (event) => {
    let value = event.target.value;

    if (field === "phone") {
      value = value.replace(/[^\d+]/g, "");
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("order data:", form, items); // Здесь будет логика отправки данных на сервер и очистки корзины
  };

  return (
    <StoreLayout>
      <section className={style.checkoutPage}>
        <div className="container">
          <Breadcrumbs
            items={[
              { label: "Главная", href: "/" },
              { label: "Корзина", href: "/cart" },
              { label: "Оформление заказа" },
            ]}
          />

          <h1 className="pageTitle">Оформление заказа</h1>

          <div className={style.layout}>
            <div className={style.formBlock}>
              <div className={`${style.card} card`}>
                <h2 className={style.blockTitle}>Данные покупателя</h2>

                <form
                  id="checkout-form"
                  className={style.form}
                  onSubmit={handleSubmit}
                >
                  <div className={style.row}>
                    <div className={style.field}>
                      <label className={style.label}>Имя покупателя *</label>
                      <input
                        type="text"
                        className="input"
                        value={form.name}
                        onChange={handleChange("name")}
                        placeholder="Иван Иванов"
                        required
                      />
                    </div>

                    <div className={style.field}>
                      <label className={style.label}>Телефон *</label>
                      <input
                        type="tel"
                        className="input"
                        value={form.phone}
                        onChange={handleChange("phone")}
                        placeholder="+7 (999) 000-00-00"
                        pattern="\+7\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}"
                        title="Формат номера: +7 (999) 123-45-67"
                        required
                      />
                    </div>
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Email *</label>
                    <input
                      type="email"
                      className="input"
                      value={form.email}
                      onChange={handleChange("email")}
                      placeholder="example@mail.ru"
                      required
                    />
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Адрес доставки *</label>
                    <input
                      type="text"
                      className="input"
                      value={form.address}
                      onChange={handleChange("address")}
                      placeholder="Город, улица, дом, квартира"
                      required
                    />
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Комментарий к заказу</label>
                    <textarea
                      className="textarea"
                      value={form.comment}
                      onChange={handleChange("comment")}
                      placeholder="Дополнительные пожелания..."
                    />
                  </div>
                </form>
              </div>
            </div>

            <aside className={style.summary}>
              <div className={`${style.summaryCard} card`}>
                <h2 className={style.blockTitle}>Состав заказа</h2>

                {items.length === 0 ? (
                  <p className={style.emptyText}>
                    Ваша корзина пуста. Добавьте товары перед оформлением заказа.
                  </p>
                ) : (
                  <>
                    {items.map((item) => (
                      <div key={item.id} className={style.productLine}>
                        <div>
                          <p className={style.productTitle}>{item.name}</p>
                          <p className={style.productMeta}>
                            {item.quantity} x {item.price} ₽
                          </p>
                        </div>
                        <span className={style.productPrice}>
                          {item.price * item.quantity} ₽
                        </span>
                      </div>
                    ))}

                    <div className={style.totalRow}>
                      <span>Итого:</span>
                      <span>{totalPrice} ₽</span>
                    </div>

                    <button
                      type="submit"
                      form="checkout-form"
                      className={`btn btnPrimary ${style.submitButton}`}
                    >
                      Подтвердить заказ
                    </button>

                    <p className={style.policyText}>
                      Нажимая «Подтвердить», вы соглашаетесь с условиями обработки
                      персональных данных
                    </p>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}