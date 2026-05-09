import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import StoreLayout from "../../layouts/StoreLayout";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import style from "../LoginPage/LoginPage.module.css";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../api/auth";

export default function RegisterPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();

    const [form, setForm] = useState({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!loading && isAuthenticated) {
        return <Navigate to="/account" replace />;
    }

    const handleChange = (field) => (event) => {
        let value = event.target.value;

        if (field === "phone") {
        value = value.replace(/[^\d+]/g, "");
        }

        setForm((prev) => ({
        ...prev,
        [field]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (
        !form.email ||
        !form.firstName ||
        !form.lastName ||
        !form.phone ||
        !form.password ||
        !form.confirmPassword
        ) {
        setError("Заполните все поля");
        return;
        }

        if (form.password.length < 6) {
        setError("Пароль должен содержать минимум 6 символов");
        return;
        }

        if (form.password !== form.confirmPassword) {
        setError("Пароли не совпадают");
        return;
        }

        try {
        setIsSubmitting(true);

        await registerUser({
            email: form.email,
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            password: form.password,
            confirm_password: form.confirmPassword,
        });

        setSuccess("Регистрация прошла успешно. Теперь войдите в аккаунт.");

        setTimeout(() => {
            navigate("/login");
        }, 1200);
        } catch (err) {
        setError(err.message || "Не удалось зарегистрироваться");
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
                { label: "Регистрация" },
                ]}
            />

            <div className={style.wrapper}>
                <div className={`${style.card} card`}>
                <div className={style.header}>
                    <h1 className={style.title}>Регистрация</h1>
                    <p className={style.subtitle}>
                    Создайте аккаунт, чтобы сохранять адреса и быстрее оформлять
                    заказы
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
                    <label className={style.label}>Имя</label>
                    <input
                        type="text"
                        className="input"
                        value={form.firstName}
                        onChange={handleChange("firstName")}
                        placeholder="Иван"
                    />
                    </div>

                    <div className={style.field}>
                    <label className={style.label}>Фамилия</label>
                    <input
                        type="text"
                        className="input"
                        value={form.lastName}
                        onChange={handleChange("lastName")}
                        placeholder="Иванов"
                    />
                    </div>

                    <div className={style.field}>
                    <label className={style.label}>Телефон</label>
                    <input
                        type="tel"
                        className="input"
                        value={form.phone}
                        onChange={handleChange("phone")}
                        placeholder="+79990000000"
                    />
                    </div>

                    <div className={style.field}>
                    <label className={style.label}>Пароль</label>
                    <input
                        type="password"
                        className="input"
                        value={form.password}
                        onChange={handleChange("password")}
                        placeholder="Введите пароль"
                    />
                    </div>

                    <div className={style.field}>
                    <label className={style.label}>Подтвердите пароль</label>
                    <input
                        type="password"
                        className="input"
                        value={form.confirmPassword}
                        onChange={handleChange("confirmPassword")}
                        placeholder="Повторите пароль"
                    />
                    </div>

                    {error && <p className={style.error}>{error}</p>}
                    {success && <p className={style.success}>{success}</p>}

                    <button
                    type="submit"
                    className={`btn btnPrimary ${style.submitButton}`}
                    disabled={isSubmitting}
                    >
                    {isSubmitting ? "Регистрируем..." : "Зарегистрироваться"}
                    </button>
                </form>

                <div className={style.footer}>
                    <p className={style.footerText}>Уже есть аккаунт?</p>
                    <Link to="/login" className={style.registerLink}>
                    Войти
                    </Link>
                </div>
                </div>
            </div>
            </div>
        </section>
        </StoreLayout>
    );
}