import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { getProducts, deleteProduct } from "../../api/admin";
import style from "./AdminProductsPage.module.css";

export default function AdminProductsPage() {
  const { accessToken } = useAdminAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getProducts(accessToken);
        setProducts(data);
      } catch (err) {
        setError("Ошибка загрузки товаров");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [accessToken]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Товары">
        <p>Загрузка...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Товары">
        <p style={{ color: 'red' }}>{error}</p>
      </AdminLayout>
    );
  }

  const handleDelete = async (productId) => {
  const confirmed = window.confirm("Удалить этот товар?");
  if (!confirmed) return;

  try {
      await deleteProduct(accessToken, productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
    } catch (err) {
      console.error(err);
      alert("Не удалось удалить товар");
    }
  };
  
  return (
    <AdminLayout title="Товары">
      <div className={style.page}>
        <div className={style.actions}>
          <Link to="/admin/products/new">
            <button type="button" className="btn btnPrimary">
              + Добавить товар
            </button>
          </Link>
        </div>

        <div className={`${style.filtersCard} card`}>
          <input
            type="text"
            className={`input ${style.searchInput}`}
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={`${style.tableCard} card`}>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Арт.</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  <th>Остаток</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>
                      Товары не найдены
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className={style.productName}>{product.name}</td>
                      <td className={style.sku}>{product.sku}</td>
                      <td>{product.category || '—'}</td>
                      <td className={style.price}>{product.price} ₽</td>
                      <td>{product.stockQty ?? product.stock_quantity ?? 0}</td>
                      <td>
                        <span
                          className={`${style.status} ${
                            !(product.isActive ?? product.is_active) ? style.statusInactive : ""
                          }`}
                        >
                          {product.isActive ?? product.is_active ? "Активен" : "Неактивен"}
                        </span>
                      </td>
                      <td>
                        <div className={style.actionsCell}>
                          <Link to={`/admin/products/${product.id}/edit`}>
                            <button type="button" className={style.iconButton}>
                              ✏
                            </button>
                          </Link>
                          <button type="button" className={style.iconButton} onClick={() => handleDelete(product.id)}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}