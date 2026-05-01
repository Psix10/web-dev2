import React from "react";
import { Link } from "react-router-dom";
import style from "./ProductCard.module.css";
import { useCart } from "../../context/CartContext";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <article className={style.card}>
      <Link to={`/product/${product.id}`} className={style.imageWrap}>
        <img src={product.image} alt={product.name} className={style.image} />
      </Link>

      <div className={style.info}>
        <p className={style.sku}>{product.sku}</p>

        <Link to={`/product/${product.id}`} className={style.title}>
          {product.name}
        </Link>

        <p className={style.description}>{product.description}</p>

        <div className={style.bottom}>
          <span className={style.price}>{product.price} ₽</span>
          <button type="button" className={style.button} onClick={() => addToCart(product)}>
            В корзину
          </button>
        </div>
      </div>
    </article>
  );
}