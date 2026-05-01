import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import StoreLayout from "../../layouts/StoreLayout";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { useCart } from "../../context/CartContext";
import style from "./ProductPage.module.css";
import { products } from "../../data/products";

export default function ProductPage() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);

    const product = products.find((item) => item.id === Number(id));

    if (!product) {
        return (
        <StoreLayout>
            <section className={style.productPage}>
            <div className="container">
                <h1 className={style.title}>Товар не найден</h1>
                <Link to="/catalog">Вернуться в каталог</Link>
            </div>
            </section>
        </StoreLayout>
        );
    }

    const handleDecrease = () => {
        setQuantity((prev) => Math.max(1, prev - 1));
    };

    const handleIncrease = () => {
        setQuantity((prev) => Math.min(product.stock, prev + 1));
    };

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i += 1) {
        addToCart(product);
        }
    };

    return (
        <StoreLayout>
        <section className={style.productPage}>
            <div className="container">
            <Breadcrumbs
                items={[
                { label: "Главная", href: "/" },
                { label: "Каталог", href: "/catalog" },
                { label: product.category, href: "/catalog" },
                { label: product.name },
                ]}
            />

            <div className={style.card}>
                <div className={style.imageWrap}>
                <img
                    src={product.image}
                    alt={product.name}
                    className={style.image}
                />
                </div>

                <div className={style.content}>
                <div className={style.meta}>
                    <span className={style.sku}>Арт.: {product.sku}</span>
                    <span className={style.category}>{product.category}</span>
                </div>

                <h1 className={style.title}>{product.name}</h1>

                <p className={style.description}>{product.description}</p>

                <div className={style.purchaseBlock}>
                    <div className={style.priceRow}>
                    <span className={style.price}>{product.price} ₽</span>
                    <span className={style.stock}>
                        В наличии: {product.stock} шт.
                    </span>
                    </div>

                    <div className={style.actions}>
                    <div className={style.counter}>
                        <button
                        type="button"
                        className={style.counterButton}
                        onClick={handleDecrease}
                        >
                        −
                        </button>

                        <span className={style.counterValue}>{quantity}</span>

                        <button
                        type="button"
                        className={style.counterButton}
                        onClick={handleIncrease}
                        >
                        +
                        </button>
                    </div>

                    <button
                        type="button"
                        className="btn btnPrimary"
                        onClick={handleAddToCart}
                    >
                        Добавить в корзину
                    </button>
                    </div>
                </div>

                <div className={style.specs}>
                    <h2 className={style.specsTitle}>Технические характеристики</h2>

                    <div className={style.specsList}>
                    <div className={style.specRow}>
                        <span>Мощность</span>
                        <span>9 Вт</span>
                    </div>

                    <div className={style.specRow}>
                        <span>Напряжение</span>
                        <span>220 В</span>
                    </div>

                    <div className={style.specRow}>
                        <span>Тип цоколя</span>
                        <span>E27</span>
                    </div>

                    <div className={style.specRow}>
                        <span>Цветовая температура</span>
                        <span>4000 К (нейтральный белый)</span>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </section>
        </StoreLayout>
    );
}