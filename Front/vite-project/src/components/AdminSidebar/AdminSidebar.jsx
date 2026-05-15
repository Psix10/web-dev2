import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import style from "./AdminSidebar.module.css";

export default function AdminSidebar() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const getLinkClass = ({ isActive }) =>
    isActive ? `${style.link} ${style.active}` : style.link;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (err) {
      console.error('Logout error:', err);
      navigate("/admin/login");
    }
  };

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
        <button type="button" className={style.logout} onClick={handleLogout}>
          Выйти
        </button>

        <div className={style.profile}>
          <span>{admin?.email || 'Администратор'}</span>
          <Link to="/" className={style.openStore}>
            Открыть магазин
          </Link>
        </div>
      </div>
    </aside>
  );
}