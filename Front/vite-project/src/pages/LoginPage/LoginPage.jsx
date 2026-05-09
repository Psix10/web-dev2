import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import StoreLayout from "../../layouts/StoreLayout";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import style from "./LoginPage.module.css";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading } = useAuth();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!loading && isAuthenticated) {
        return <Navigate to="/account" replace />;
    }

    const handleChange = (field) => (event) => {
        setForm((prev) => ({
        ...prev,
        [field]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.email || !form.password) {
        setError("Заполните email и пароль");
        return;
        }

        try {
        setIsSubmitting(true);
        await login(form);
        navigate("/account");
        } catch (err) {
        setError(err.message || "Не удалось выполнить вход");
        } finally {
        setIsSubmitting(false);
        }
    };

    return (
        <StoreLayout>
        <section className={style.loginPage}>
            <div className="container">
            <Breadcrumbs
                items={[
                { label: "Главная", href: "/" },
                { label: "Вход" },
                ]}
            />

            <div className={style.wrapper}>
                <div className={`${style.card} card`}>
                <div className={style.header}>
                    <h1 className={style.title}>Вход в личный кабинет</h1>
                    <p className={style.subtitle}>
                    Войдите, чтобы оформить заказ быстрее и отслеживать покупки
                    </p>
                </div>

                <form className={style.form} onSubmit={handleSubmit}>
                    <div className={style.field}>
                    <label className={style.label}>Email</label>
                    <input
                        type="email"
                        className="input"
                        value={form.email}
                        onChange={handleChange("email")}
                        placeholder="example@mail.ru"
                    />
                    </div>

                    <div className={style.field}>
                    <div className={style.labelRow}>
                        <label className={style.label}>Пароль</label>
                        <Link to="/forgot-password" className={style.inlineLink}>
                        Забыли пароль?
                        </Link>
                    </div>

                    <input
                        type="password"
                        className="input"
                        value={form.password}
                        onChange={handleChange("password")}
                        placeholder="Введите пароль"
                    />
                    </div>

                    {error && <p className={style.error}>{error}</p>}

                    <button
                    type="submit"
                    className={`btn btnPrimary ${style.submitButton}`}
                    disabled={isSubmitting}
                    >
                    {isSubmitting ? "Входим..." : "Войти"}
                    </button>
                </form>

                <div className={style.footer}>
                    <p className={style.footerText}>Ещё нет аккаунта?</p>
                    <Link to="/register" className={style.registerLink}>
                    Зарегистрироваться
                    </Link>
                </div>
                </div>
            </div>
            </div>
        </section>
        </StoreLayout>
    );
}