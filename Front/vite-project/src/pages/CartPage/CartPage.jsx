import React from "react";
import { Link, useNavigate } from "react-router-dom";
import StoreLayout from "../../layouts/StoreLayout";
import { useCart } from "../../context/CartContext";
import style from "./CartPage.module.css";

export default function CartPage() {
  const {
    items,
    totalItems,
    totalPrice,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const isEmpty = items.length === 0;
  const navigate = useNavigate();

  return (
    <StoreLayout>
      <section className={style.cart}>
        <div className="container">
          <div className={style.breadcrumbs}>
            <Link to="/" className={style.breadcrumbLink}>
              Главная
            </Link>
            <span className={style.breadcrumbSeparator}>/</span>
            <span className={style.breadcrumbCurrent}>Корзина</span>
          </div>

          <h1 className={style.title}>Корзина</h1>

          {isEmpty ? (
            <div className={style.empty}>
              <p className={style.emptyText}>Ваша корзина пуста.</p>
              <Link to="/catalog" className={style.emptyButton}>
                Перейти в каталог
              </Link>
            </div>
          ) : (
            <div className={style.layout}>
              {/* Список товаров */}
              <div className={style.items}>
                {items.map((item) => (
                  <article key={item.id} className={style.itemCard}>
                    <div className={style.itemImageWrap}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className={style.itemImage}
                      />
                    </div>

                    <div className={style.itemInfo}>
                      <h2 className={style.itemTitle}>{item.name}</h2>
                      <p className={style.itemSku}>{item.sku}</p>
                      <p className={style.itemPrice}>
                        {item.price.toLocaleString("ru-RU")} ₽ / шт.
                      </p>
                    </div>

                    <div className={style.itemControls}>
                      <div className={style.counter}>
                        <button
                          type="button"
                          className={style.counterButton}
                          onClick={() => decreaseQuantity(item.id)}
                        >
                          –
                        </button>
                        <span className={style.counterValue}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className={style.counterButton}
                          onClick={() => increaseQuantity(item.id)}
                        >
                          +
                        </button>
                      </div>

                      <p className={style.itemTotal}>
                        {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                      </p>

                      <button
                        type="button"
                        className={style.removeButton}
                        onClick={() => removeFromCart(item.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Итого заказа */}
              <aside className={style.summary}>
                <div className={style.summaryCard}>
                  <h2 className={style.summaryTitle}>Итого заказа</h2>

                  <div className={style.summaryRow}>
                    <span className={style.summaryLabel}>
                      Товаров: {totalItems}
                    </span>
                    <span className={style.summaryValue}>
                      {totalPrice.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>

                  <div className={style.summaryRow}>
                    <span className={style.summaryLabel}>Доставка</span>
                    <span className={style.summaryValue}>Бесплатно</span>
                  </div>

                  <div className={style.summaryDivider} />

                  <div className={style.summaryRowTotal}>
                    <span className={style.summaryTotalLabel}>Итого:</span>
                    <span className={style.summaryTotalValue}>
                      {totalPrice.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>

                  <button
                    type="button"
                    className={style.summaryPrimaryButton}
                    onClick={() => {if (items.length > 0) navigate("/checkout")}}
                  >
                    Оформить заказ →
                  </button>

                  <Link to="/catalog" className={style.summarySecondaryButton}>
                    Продолжить покупки
                  </Link>

                  <button
                    type="button"
                    className={style.clearButton}
                    onClick={clearCart}
                  >
                    Очистить корзину
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </StoreLayout>
  );
}