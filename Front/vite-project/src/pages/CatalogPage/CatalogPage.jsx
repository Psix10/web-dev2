import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import StoreLayout from "../../layouts/StoreLayout";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import ProductCard from "../../components/ProductCard/ProductCard";
import style from "./CatalogPage.module.css";
import { getProducts, getCategories } from "../../api/product";

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["Все категории"]);
  const [selectedCategory, setSelectedCategory] = useState("Все категории");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCatalogData = async () => {
      setLoading(true);
      setError("");

      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        setProducts(productsData.items || []);
        setCategories([
          "Все категории",
          ...(categoriesData || []).map((category) => category.name),
        ]);
      } catch (err) {
        console.error("Failed to load catalog data:", err);
        setError(err.message || "Не удалось загрузить каталог");
        setProducts([]);
        setCategories(["Все категории"]);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogData();
  }, []);

  useEffect(() => {
    if (categoryFromUrl && categories.includes(categoryFromUrl)) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory("Все категории");
    }
  }, [categoryFromUrl, categories]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);

    const nextParams = new URLSearchParams(searchParams);

    if (category === "Все категории") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", category);
    }

    setSearchParams(nextParams);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "Все категории" ||
        product.category === selectedCategory;

      const matchesSearch = (product.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  return (
    <StoreLayout>
      <section className={style.catalog}>
        <div className="container">
          <Breadcrumbs
            items={[
              { label: "Главная", href: "/" },
              { label: "Каталог" },
            ]}
          />

          <h1 className="pageTitle">Каталог товаров</h1>

          <div className={style.layout}>
            <aside className={style.sidebar}>
              <div className={style.filtersCard}>
                <div className={style.filtersHeader}>
                  <span className={style.filterIcon}>≡</span>
                  <h2 className={style.filtersTitle}>Фильтры</h2>
                </div>

                <div className={style.filterBlock}>
                  <p className={style.filterLabel}>Категория</p>

                  <div className={style.categoryList}>
                    {categories.map((category) => (
                      <button
                        key={category}
                        className={`${style.categoryButton} ${
                          selectedCategory === category
                            ? style.categoryButtonActive
                            : ""
                        }`}
                        type="button"
                        onClick={() => handleCategoryChange(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className={style.content}>
              <div className={style.toolbar}>
                <input
                  className="input"
                  type="text"
                  placeholder="Поиск по названию..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <p className={style.count}>Загрузка товаров...</p>
              ) : error ? (
                <p className={style.count}>{error}</p>
              ) : (
                <p className={style.count}>
                  Найдено товаров: {filteredProducts.length}
                </p>
              )}

              <div className={style.grid}>
                {!loading &&
                  !error &&
                  filteredProducts.map((product) => (
                    <div key={product.id} className={style.cardWrap}>
                      <ProductCard product={product} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}