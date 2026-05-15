import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { useAdminAuth } from "../../context/AdminAuthContext";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/category";
import style from "./AdminCategoriesPage.module.css";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/ё/g, "e")
    .replace(/й/g, "i")
    .replace(/ц/g, "ts")
    .replace(/у/g, "u")
    .replace(/к/g, "k")
    .replace(/е/g, "e")
    .replace(/н/g, "n")
    .replace(/г/g, "g")
    .replace(/ш/g, "sh")
    .replace(/щ/g, "sch")
    .replace(/з/g, "z")
    .replace(/х/g, "h")
    .replace(/ъ/g, "")
    .replace(/ф/g, "f")
    .replace(/ы/g, "y")
    .replace(/в/g, "v")
    .replace(/а/g, "a")
    .replace(/п/g, "p")
    .replace(/р/g, "r")
    .replace(/о/g, "o")
    .replace(/л/g, "l")
    .replace(/д/g, "d")
    .replace(/ж/g, "zh")
    .replace(/э/g, "e")
    .replace(/я/g, "ya")
    .replace(/ч/g, "ch")
    .replace(/с/g, "s")
    .replace(/м/g, "m")
    .replace(/и/g, "i")
    .replace(/т/g, "t")
    .replace(/ь/g, "")
    .replace(/б/g, "b")
    .replace(/ю/g, "yu")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCategoryForm(category = null) {
  return {
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    isActive:
      category?.is_active ??
      category?.isActive ??
      true,
  };
}

export default function AdminCategoriesPage() {
  const { accessToken } = useAdminAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(buildCategoryForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const isEditMode = Boolean(editTarget);

  const fetchCategories = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError("");

    try {
      const data = await getCategories(accessToken);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Не удалось загрузить категории");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "ru")
    );
  }, [categories]);

  const openCreateModal = () => {
    setEditTarget(null);
    setForm(buildCategoryForm());
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditTarget(category);
    setForm(buildCategoryForm(category));
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditTarget(null);
    setForm(buildCategoryForm());
    setFormError("");
  };

  const handleChange = (field) => (event) => {
    const value =
      field === "isActive" ? event.target.checked : event.target.value;

    setForm((prev) => {
      if (field === "name") {
        const shouldAutofillSlug =
          !prev.slug || prev.slug === slugify(prev.name);

        return {
          ...prev,
          name: value,
          slug: shouldAutofillSlug ? slugify(value) : prev.slug,
        };
      }

      if (field === "slug") {
        return {
          ...prev,
          slug: slugify(value),
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalized = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      description: form.description.trim() || null,
      is_active: Boolean(form.isActive),
    };

    if (!normalized.name) {
      setFormError("Введите название категории");
      return;
    }

    if (!normalized.slug) {
      setFormError("Slug не может быть пустым");
      return;
    }

    const duplicate = categories.find(
      (item) =>
        item.slug === normalized.slug &&
        Number(item.id) !== Number(editTarget?.id)
    );

    if (duplicate) {
      setFormError("Категория с таким slug уже существует");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (isEditMode) {
        await updateCategory(accessToken, editTarget.id, normalized);
      } else {
        await createCategory(accessToken, normalized);
      }

      await fetchCategories();
      closeModal();
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Не удалось сохранить категорию");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Удалить категорию «${category.name}»?`
    );

    if (!confirmed) return;

    setDeletingId(category.id);

    try {
      await deleteCategory(accessToken, category.id);
      await fetchCategories();
    } catch (err) {
      console.error(err);
      alert(err.message || "Не удалось удалить категорию");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Категории">
      <div className={style.page}>
        <div className={style.actions}>
          <button
            type="button"
            className="btn btnPrimary"
            onClick={openCreateModal}
          >
            + Добавить
          </button>
        </div>

        {loading ? (
          <div className={`${style.tableCard} card`}>
            <p>Загрузка категорий...</p>
          </div>
        ) : error ? (
          <div className={`${style.tableCard} card`}>
            <p className={style.errorText}>{error}</p>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className={`${style.tableCard} card`}>
            <div className={style.emptyState}>
              <p className={style.emptyTitle}>Категорий пока нет</p>
              <p className={style.emptyText}>
                Создайте первую категорию, чтобы начать наполнять каталог.
              </p>
              <button
                type="button"
                className="btn btnPrimary"
                onClick={openCreateModal}
              >
                Добавить категорию
              </button>
            </div>
          </div>
        ) : (
          <div className={`${style.tableCard} card`}>
            <div className={style.tableWrap}>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Slug</th>
                    <th>Описание</th>
                    <th>Статус</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {sortedCategories.map((category) => {
                    const isActive =
                      category.is_active ?? category.isActive ?? false;

                    return (
                      <tr key={category.id || category.slug}>
                        <td className={style.name}>{category.name}</td>
                        <td className={style.slug}>{category.slug}</td>
                        <td className={style.description}>
                          {category.description || "—"}
                        </td>
                        <td>
                          <span
                            className={
                              isActive ? style.statusActive : style.statusInactive
                            }
                          >
                            {isActive ? "Активна" : "Скрыта"}
                          </span>
                        </td>
                        <td>
                          <div className={style.actionsCell}>
                            <button
                              type="button"
                              className={style.iconButton}
                              onClick={() => openEditModal(category)}
                              aria-label={`Редактировать ${category.name}`}
                              title="Редактировать"
                            >
                              ✏
                            </button>

                            <button
                              type="button"
                              className={style.iconButton}
                              onClick={() => handleDelete(category)}
                              disabled={deletingId === category.id}
                              aria-label={`Удалить ${category.name}`}
                              title="Удалить"
                            >
                              {deletingId === category.id ? "..." : "🗑"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modalOpen && (
          <div
            className={style.modalOverlay}
            onClick={closeModal}
            role="presentation"
          >
            <div
              className={`${style.modal} card`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-modal-title"
            >
              <div className={style.modalHeader}>
                <h2 id="category-modal-title" className={style.modalTitle}>
                  {isEditMode ? "Редактировать категорию" : "Новая категория"}
                </h2>

                <button
                  type="button"
                  className={style.closeButton}
                  onClick={closeModal}
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </div>

              <form className={style.form} onSubmit={handleSubmit}>
                <div className={style.field}>
                  <label className={style.label}>Название *</label>
                  <input
                    type="text"
                    className="input"
                    value={form.name}
                    onChange={handleChange("name")}
                    placeholder="Например, Светодиодные лампы"
                  />
                </div>

                <div className={style.field}>
                  <label className={style.label}>Slug *</label>
                  <input
                    type="text"
                    className="input"
                    value={form.slug}
                    onChange={handleChange("slug")}
                    placeholder="led"
                  />
                </div>

                <div className={style.field}>
                  <label className={style.label}>Описание</label>
                  <textarea
                    className="textarea"
                    value={form.description}
                    onChange={handleChange("description")}
                    placeholder="Краткое описание категории"
                    rows={4}
                  />
                </div>

                <label className={style.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleChange("isActive")}
                  />
                  <span>Категория активна</span>
                </label>

                {formError && <p className={style.errorText}>{formError}</p>}

                <div className={style.formActions}>
                  <button
                    type="button"
                    className={`btn ${style.secondaryButton}`}
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Отмена
                  </button>

                  <button
                    type="submit"
                    className="btn btnPrimary"
                    disabled={saving}
                  >
                    {saving
                      ? "Сохранение..."
                      : isEditMode
                      ? "Сохранить"
                      : "Создать"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}