import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StoreLayout from "../../layouts/StoreLayout";
import ProductCard from "../../components/ProductCard/ProductCard";
import style from "./HomePage.module.css";
import { getProducts, getCategories } from "../../api/product";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      setError("");

      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        setCategories((categoriesData || []).map((category) => category.name));
        setPopularProducts((productsData.items || []).slice(0, 4));
      } catch (err) {
        console.error("Failed to load home page data:", err);
        setError(err.message || "Не удалось загрузить данные главной страницы");
        setCategories([]);
        setPopularProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

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

          {loading ? (
            <p>Загрузка товаров...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className={style.grid}>
              {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </StoreLayout>
  );
}