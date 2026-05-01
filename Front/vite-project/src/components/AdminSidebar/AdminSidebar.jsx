import React from "react";
import { NavLink, Link } from "react-router-dom";
import style from "./AdminSidebar.module.css";

export default function AdminSidebar() {
  const getLinkClass = ({ isActive }) =>
    isActive ? `${style.link} ${style.active}` : style.link;

  return (
    <aside className={style.sidebar}>
      <div>
        <div className={style.brand}>
          <h2 className={style.logo}>LightHub</h2>
          <p className={style.subtitle}>Панель управления</p>
        </div>

        <nav className={style.nav}>
          <NavLink to="/admin/dashboard" className={getLinkClass}>
            Дашборд
          </NavLink>
          <NavLink to="/admin/products" className={getLinkClass}>
            Товары
          </NavLink>
          <NavLink to="/admin/orders" className={getLinkClass}>
            Заказы
          </NavLink>
          <NavLink to="/admin/categories" className={getLinkClass}>
            Категории
          </NavLink>
        </nav>
      </div>

      <div className={style.footer}>
        <button type="button" className={style.logout}>
          Выйти
        </button>

        <div className={style.profile}>
          <span>Администратор</span>
          <Link to="/" className={style.openStore}>
            Открыть магазин
          </Link>
        </div>
      </div>
    </aside>
  );
}