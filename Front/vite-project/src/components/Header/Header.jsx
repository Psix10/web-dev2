import React from "react";
import { Link, NavLink } from "react-router-dom";
import style from "./Header.module.css";
import logo from "../../assets/logo.png";
import buy from "../../assets/buy.png";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { totalItems } = useCart();
  const { isAuthenticated, loading } = useAuth();

  const accountPath = isAuthenticated ? "/account" : "/login";
  const accountLabel = loading
    ? "..."
    : isAuthenticated
    ? "Личный кабинет"
    : "Войти";

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

          <NavLink
            to={accountPath}
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            {accountLabel}
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