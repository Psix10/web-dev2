import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StoreLayout from "../../layouts/StoreLayout";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { useCart } from "../../context/CartContext";
import style from "./ProductPage.module.css";
import { getProductById } from "../../api/product";
import lampImage from "../../assets/lamp.png";

export default function ProductPage() {
    const { id } = useParams();
    const { addToCart } = useCart();

    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProduct = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getProductById(id);
            setProduct(data);
        } catch (err) {
            console.error("Failed to load product:", err);
            setError(err.message || "Не удалось загрузить товар");
            setProduct(null);
        } finally {
            setLoading(false);
        }
        };

        if (id) {
        fetchProduct();
        }
    }, [id]);

    if (loading) {
        return (
        <StoreLayout>
            <section className={style.productPage}>
            <div className="container">
                <p>Загрузка товара...</p>
            </div>
            </section>
        </StoreLayout>
        );
    }

    if (error || !product) {
        return (
        <StoreLayout>
            <section className={style.productPage}>
            <div className="container">
                <h1 className={style.title}>{error || "Товар не найден"}</h1>
                <Link to="/catalog">Вернуться в каталог</Link>
            </div>
            </section>
        </StoreLayout>
        );
    }

    const imageSrc = product.imageUrl ?? product.image ?? lampImage;
    const stockQuantity =
        product.stockQty ?? product.stock_quantity ?? product.stockQuantity ?? 0;

    const wattage = product.wattage ?? null;
    const voltage = product.voltage ?? null;
    const baseType = product.baseType ?? product.base_type ?? null;
    const colorTemperature =
        product.colorTemperature ?? product.color_temperature ?? null;

    const handleDecrease = () => {
        setQuantity((prev) => Math.max(1, prev - 1));
    };

    const handleIncrease = () => {
        if (stockQuantity > 0) {
        setQuantity((prev) => Math.min(stockQuantity, prev + 1));
        }
    };

    const handleAddToCart = () => {
        const cartItem = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: Number(product.price) || 0,
        image: imageSrc,
        imageUrl: product.imageUrl ?? null,
        description: product.description ?? "",
        slug: product.slug ?? null,
        category: product.category ?? null,
        };

        for (let i = 0; i < quantity; i += 1) {
        addToCart(cartItem);
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
                { label: product.category ?? "Товары", href: "/catalog" },
                { label: product.name },
                ]}
            />

            <div className={style.card}>
                <div className={style.imageWrap}>
                <img
                    src={imageSrc}
                    alt={product.name}
                    className={style.image}
                    onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = lampImage;
                    }}
                />
                </div>

                <div className={style.content}>
                <div className={style.meta}>
                    <span className={style.sku}>Арт.: {product.sku}</span>
                    {product.category && (
                    <span className={style.category}>{product.category}</span>
                    )}
                </div>

                <h1 className={style.title}>{product.name}</h1>

                <p className={style.description}>
                    {product.description ?? "Описание товара пока не добавлено."}
                </p>

                <div className={style.purchaseBlock}>
                    <div className={style.priceRow}>
                    <span className={style.price}>{Number(product.price)} ₽</span>
                    <span className={style.stock}>
                        В наличии: {stockQuantity} шт.
                    </span>
                    </div>

                    <div className={style.actions}>
                    <div className={style.counter}>
                        <button
                        type="button"
                        className={style.counterButton}
                        onClick={handleDecrease}
                        disabled={quantity <= 1}
                        >
                        −
                        </button>

                        <span className={style.counterValue}>{quantity}</span>

                        <button
                        type="button"
                        className={style.counterButton}
                        onClick={handleIncrease}
                        disabled={stockQuantity === 0 || quantity >= stockQuantity}
                        >
                        +
                        </button>
                    </div>

                    <button
                        type="button"
                        className="btn btnPrimary"
                        onClick={handleAddToCart}
                        disabled={stockQuantity === 0}
                    >
                        {stockQuantity > 0 ? "Добавить в корзину" : "Нет в наличии"}
                    </button>
                    </div>
                </div>

                {(wattage || voltage || baseType || colorTemperature) && (
                    <div className={style.specs}>
                    <h2 className={style.specsTitle}>
                        Технические характеристики
                    </h2>

                    <div className={style.specsList}>
                        {wattage && (
                        <div className={style.specRow}>
                            <span>Мощность</span>
                            <span>{wattage} Вт</span>
                        </div>
                        )}

                        {voltage && (
                        <div className={style.specRow}>
                            <span>Напряжение</span>
                            <span>{voltage} В</span>
                        </div>
                        )}

                        {baseType && (
                        <div className={style.specRow}>
                            <span>Тип цоколя</span>
                            <span>{baseType}</span>
                        </div>
                        )}

                        {colorTemperature && (
                        <div className={style.specRow}>
                            <span>Цветовая температура</span>
                            <span>{colorTemperature} К</span>
                        </div>
                        )}
                    </div>
                    </div>
                )}
                </div>
            </div>
            </div>
        </section>
        </StoreLayout>
    );
}