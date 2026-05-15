import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { createProduct, updateProduct, getProduct, getCategories } from "../../api/admin";
import style from "./AdminProductCreatePage.module.css";

export default function AdminProductCreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAdminAuth();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    slug: "",
    imageUrl: "",
    description: "",
    categoryId: "",
    price: "",
    stockQty: "",
    wattage: "",
    voltage: "",
    baseType: "",
    colorTemperature: "",
    isActive: true,
  });

  const getProductImageUrl = (data) => {
    if (!data) return "";

    if (typeof data.imageUrl === "string" && data.imageUrl.trim()) {
      return data.imageUrl;
    }

    if (typeof data.image_url === "string" && data.image_url.trim()) {
      return data.image_url;
    }

    if (Array.isArray(data.images) && data.images.length > 0) {
      const mainImage =
        data.images.find((image) => image.isMain || image.is_main) || data.images[0];

      return mainImage?.imageUrl || mainImage?.image_url || "";
    }

    return "";
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories(accessToken);
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, [accessToken]);

  useEffect(() => {
    if (!isEdit) return;

    const fetchProduct = async () => {
      try {
        const data = await getProduct(accessToken, id);

        setFormData({
          name: data.name || "",
          sku: data.sku || "",
          slug: data.slug || "",
          imageUrl: getProductImageUrl(data),
          description: data.description || "",
          categoryId: String(data.categoryId || data.category_id || ""),
          price: String(data.price ?? ""),
          stockQty: String(data.stockQty ?? data.stock_quantity ?? ""),
          wattage: String(data.wattage ?? ""),
          voltage: String(data.voltage ?? ""),
          baseType: data.baseType || data.base_type || "",
          colorTemperature: String(
            data.colorTemperature ?? data.color_temperature ?? ""
          ),
          isActive: data.isActive ?? data.is_active ?? true,
        });
      } catch (err) {
        setError("Ошибка загрузки товара");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [accessToken, id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        slug: formData.slug,
        description: formData.description,
        category_id: Number(formData.categoryId),
        price: Number(formData.price),
        stock_quantity: Number(formData.stockQty),
        wattage: formData.wattage || null,
        voltage: formData.voltage || null,
        base_type: formData.baseType || null,
        color_temperature: formData.colorTemperature || null,
        is_active: formData.isActive,
        images: formData.imageUrl.trim()
          ? [
              {
                image_url: formData.imageUrl.trim(),
                is_main: true,
                sort_order: 0,
              },
            ]
          : [],
      };

      if (isEdit) {
        await updateProduct(accessToken, id, payload);
      } else {
        await createProduct(accessToken, payload);
      }

      navigate("/admin/products");
    } catch (err) {
      console.error("SAVE PRODUCT ERROR:", err);
      const errorMessage = 
        typeof err.message === "string" 
          ? err.message 
          : err.detail 
          ? JSON.stringify(err.detail)
          : "Ошибка сохранения товара";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Товары">
        <p>Загрузка...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Товары">
      <div className={style.page}>
        <a href="/admin/products" className={style.backLink}>
          ← Назад к списку
        </a>

        <h1 className={style.pageTitle}>
          {isEdit ? "Редактировать товар" : "Новый товар"}
        </h1>

        {error && (
          <div style={{ 
            padding: '12px', 
            background: '#fee', 
            color: '#c00', 
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={style.formLayout}>
            <div className={style.mainColumn}>
              <section className={`${style.card} card`}>
                <h2 className={style.sectionTitle}>Основное</h2>

                <div className={style.formGrid}>
                  <div className={style.field}>
                    <label className={style.label}>Название *</label>
                    <input
                      type="text"
                      name="name"
                      className="input"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Артикул (SKU) *</label>
                    <input
                      type="text"
                      name="sku"
                      className="input"
                      value={formData.sku}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Slug *</label>
                    <input
                      type="text"
                      name="slug"
                      className="input"
                      value={formData.slug}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className={`${style.field} ${style.fullWidth}`}>
                    <label className={style.label}>URL изображения *</label>
                    <input
                      type="text"
                      name="imageUrl"
                      className="input"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className={`${style.field} ${style.fullWidth}`}>
                    <label className={style.label}>Описание *</label>
                    <textarea
                      name="description"
                      className="textarea"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      required
                    />
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Категория *</label>
                    <select
                      name="categoryId"
                      className="input"
                      value={formData.categoryId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Выберите...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Цена (₽) *</label>
                    <input
                      type="number"
                      name="price"
                      className="input"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Остаток (шт.) *</label>
                    <input
                      type="number"
                      name="stockQty"
                      className="input"
                      value={formData.stockQty}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>
                </div>
              </section>

              <section className={`${style.card} card`}>
                <h2 className={style.sectionTitle}>Характеристики</h2>

                <div className={style.formGrid}>
                  <div className={style.field}>
                    <label className={style.label}>Мощность</label>
                    <input
                      type="text"
                      name="wattage"
                      className="input"
                      value={formData.wattage}
                      onChange={handleChange}
                      placeholder="9 Вт"
                    />
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Напряжение</label>
                    <input
                      type="text"
                      name="voltage"
                      className="input"
                      value={formData.voltage}
                      onChange={handleChange}
                      placeholder="220 В"
                    />
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Тип цоколя</label>
                    <input
                      type="text"
                      name="baseType"
                      className="input"
                      value={formData.baseType}
                      onChange={handleChange}
                      placeholder="E27"
                    />
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Цветовая температура</label>
                    <input
                      type="text"
                      name="colorTemperature"
                      className="input"
                      value={formData.colorTemperature}
                      onChange={handleChange}
                      placeholder="4000 K"
                    />
                  </div>
                </div>
              </section>
            </div>

            <aside className={style.sideColumn}>
              <section className={`${style.card} card`}>
                <h2 className={style.sectionTitle}>Активность товара</h2>

                <label className={style.switchRow}>
                  <div>
                    <p className={style.switchTitle}>Отображается ли товар в магазине</p>
                  </div>

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  <span 
                    className={style.switch}
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    style={{ 
                      cursor: 'pointer',
                      background: formData.isActive ? '#4CAF50' : '#ccc'
                    }}
                  >
                    <span 
                      className={style.switchThumb}
                      style={{
                        transform: formData.isActive ? 'translateX(20px)' : 'translateX(0)'
                      }}
                    />
                  </span>
                </label>

                <button
                  type="submit"
                  className={`btn btnPrimary ${style.saveButton}`}
                  disabled={saving}
                >
                  {saving ? "Сохранение..." : "Сохранить товар"}
                </button>
              </section>
            </aside>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}