import React from "react";
import { Link, NavLink } from "react-router-dom";
import style from "./Header.module.css";
import logo from "../../assets/logo.png";
import buy from "../../assets/buy.png";
import { useCart } from "../../context/CartContext";

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className={style.header}>
      <div className={style.container}>
        <Link to="/" className={style.left}>
          <img src={logo} className={style.logo} alt="Lamp Shop" />
        </Link>

        <nav className={style.nav}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            Главная
          </NavLink>

          <NavLink
            to="/catalog"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            Каталог
          </NavLink>
        </nav>

        <Link to="/cart" className={style.cartButton} aria-label="Корзина">
          <img src={buy} className={style.buy} alt="Корзина" />
          {totalItems > 0 && <span className={style.badge}>{totalItems}</span>}
        </Link>
      </div>
    </header>
  );
}