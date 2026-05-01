import React from "react";
import { Link } from "react-router-dom";
import style from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={style.footer}>
      <div className={style.container}>
        <div className={style.column}>
          <h3>LightHub</h3>
          <p>
            Интернет-магазин осветительного оборудования.
            <br />
            Доставка по всей России.
          </p>
        </div>

        <div className={style.column}>
          <h3>Покупателям</h3>
          <Link to="/catalog">Каталог товаров</Link>
          <Link to="/cart">Корзина</Link>
        </div>

        <div className={style.column}>
          <h3>Контакты</h3>
          <a href="tel:+78005553535">+7 (800) 555-35-35</a>
          <a href="mailto:info@lighthub.ru">info@lighthub.ru</a>
        </div>
      </div>

      <div className={style.bottom}>
        <p>© 2026 LightHub. Все права защищены.</p>
      </div>
    </footer>
  );
}