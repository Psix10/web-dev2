import React from "react";
import style from "./AdminLoginPage.module.css";

export default function AdminLoginPage() {
  return (
    <section className={style.loginPage}>
      <div className={style.card}>
        <div className={style.header}>
          <h1 className={style.logo}>LightHub Admin</h1>
          <p className={style.subtitle}>Панель управления</p>
        </div>

        <form className={style.form}>
          <div className={style.field}>
            <label className={style.label}>Логин</label>
            <input
              type="text"
              className="input"
              defaultValue="admin"
            />
          </div>

          <div className={style.field}>
            <label className={style.label}>Пароль</label>
            <input
              type="password"
              className="input"
              defaultValue="admin123"
            />
          </div>

          <button type="button" className={`btn btnPrimary ${style.submitButton}`}>
            Войти
          </button>
        </form>

        <p className={style.demo}>Демо: admin / admin123</p>
      </div>
    </section>
  );
}