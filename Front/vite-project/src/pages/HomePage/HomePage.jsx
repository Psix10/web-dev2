import React from "react";
import { Link } from "react-router-dom";
import StoreLayout from "../../layouts/StoreLayout";
import ProductCard from "../../components/ProductCard/ProductCard";
import style from "./HomePage.module.css";
import lampImage from "../../assets/lamp.png";

const categories = [
  "Светодиодные лампы",
  "Люминесцентные",
  "Галогенные",
  "Умные лампы",
  "Промышленные",
];

const popularProducts = [
  {
    id: 1,
    sku: "LED-A60-9W-E27",
    name: "LED Лампа A60 Econom",
    price: 89,
    image: lampImage,
    description: "Стандартная светодиодная лампа формата А60...",
  },
  {
    id: 2,
    sku: "LED-GU10-7W",
    name: "LED Лампа GU10 Spot 7W",
    price: 129,
    image: lampImage,
    description: "Светодиодная лампа направленного света...",
  },
  {
    id: 3,
    sku: "LED-T8-18W-1200",
    name: "LED Трубка T8 18W 1200мм",
    price: 249,
    image: lampImage,
    description: "Светодиодная лампа в форм‑факторе трубки T8...",
  },
  {
    id: 4,
    sku: "PHILIPS-12W-E27",
    name: "Philips Master LEDlamp 12W",
    price: 349,
    image: lampImage,
    description: "Надежная LED‑лампа для повседневного освещения.",
  },
];

export default function HomePage() {
  return (
    <StoreLayout>
      <section className={style.hero}>
        <div className={style.container}>
          <div className={style.categories}>
            {categories.map((item) => (
              <Link
                key={item}
                to={`/catalog?category=${encodeURIComponent(item)}`}
                className={style.categoryLink}
              >
                {item}
              </Link>
            ))}
          </div>

          <div className={style.headRow}>
            <h1 className={style.pageTitle}>Популярные товары</h1>
            <Link to="/catalog" className={style.allLink}>
              Все товары →
            </Link>
          </div>

          <div className={style.grid}>
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}