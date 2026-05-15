import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import style from "./AdminLoginPage.module.css";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={style.loginPage}>
      <div className={style.card}>
        <div className={style.header}>
          <h1 className={style.logo}>LightHub Admin</h1>
          <p className={style.subtitle}>Панель управления</p>
        </div>

        <form className={style.form} onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              padding: '12px', 
              background: '#fee', 
              color: '#c00', 
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <div className={style.field}>
            <label className={style.label}>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className={style.field}>
            <label className={style.label}>Пароль</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className={`btn btnPrimary ${style.submitButton}`}
            disabled={loading}
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </section>
  );
}