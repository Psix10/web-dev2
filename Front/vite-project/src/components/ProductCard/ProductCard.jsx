import React from "react";
import { Link } from "react-router-dom";
import style from "./ProductCard.module.css";
import { useCart } from "../../context/CartContext";
import lampImage from "../../assets/lamp.png";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const imageSrc = product.imageUrl || product.image || lampImage;
  const description =
    product.description || "Качественная лампа для дома, офиса и бизнеса.";

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: Number(product.price) || 0,
      image: imageSrc,
      imageUrl: product.imageUrl || product.image || null,
      description,
      slug: product.slug || null,
      category: product.category || null,
    });
  };

  return (
    <article className={style.card}>
      <Link to={`/product/${product.id}`} className={style.imageWrap}>
        <img
          src={imageSrc}
          alt={product.name}
          className={style.image}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = lampImage;
          }}
        />
      </Link>

      <div className={style.info}>
        <p className={style.sku}>{product.sku}</p>

        <Link to={`/product/${product.id}`} className={style.title}>
          {product.name}
        </Link>

        <p className={style.description}>{description}</p>

        <div className={style.bottom}>
          <span className={style.price}>{Number(product.price)} ₽</span>
          <button
            type="button"
            className={style.button}
            onClick={handleAddToCart}
          >
            В корзину
          </button>
        </div>
      </div>
    </article>
  );
}