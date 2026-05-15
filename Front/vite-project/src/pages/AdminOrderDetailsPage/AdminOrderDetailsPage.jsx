import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { getOrder, updateOrderStatus, updateOrderDetails } from "../../api/admin";
import style from "./AdminOrderDetailsPage.module.css";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Новый" },
  { value: "CONFIRMED", label: "Подтверждён" },
  { value: "PROCESSING", label: "В обработке" },
  { value: "SHIPPED", label: "Отправлен" },
  { value: "DELIVERED", label: "Доставлен" },
  { value: "CANCELLED", label: "Отменён" },
];

const LOCKED_STATUSES = ["SHIPPED", "DELIVERED", "CANCELLED"];

function buildOrderForm(order) {
  if (!order) {
    return {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      deliveryAddress: "",
      comment: "",
    };
  }

  return {
    customerName: order.customer_name || order.customerName || "",
    customerPhone: order.customer_phone || order.customerPhone || "",
    customerEmail: order.customer_email || order.customerEmail || "",
    deliveryAddress:
      order.delivery_address ||
      order.deliveryAddress ||
      order.address ||
      order.full_address ||
      "",
    comment: order.comment || "",
  };
}

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const { accessToken } = useAdminAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    comment: "",
  });

  const [editableItems, setEditableItems] = useState([]);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getOrder(accessToken, id);
        setOrder(data);

        setForm(buildOrderForm(data));

        setEditableItems(
          (data.items || []).map((item, index) => ({
            localId: `${item.id || index}`,
            id: item.id || null,
            productId: item.product_id || item.productId || null,
            productNameSnapshot:
              item.product_name_snapshot || item.productNameSnapshot || "",
            priceSnapshot: Number(item.price_snapshot || item.priceSnapshot || 0),
            quantity: Number(item.quantity || 1),
          }))
        );
      } catch (err) {
        setError("Ошибка загрузки заказа");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [accessToken, id]);

  const isEditLocked = LOCKED_STATUSES.includes(order?.status);

  const computedTotal = useMemo(() => {
    return editableItems.reduce((sum, item) => {
      return sum + Number(item.priceSnapshot || 0) * Number(item.quantity || 0);
    }, 0);
  }, [editableItems]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setUpdating(true);

    try {
      await updateOrderStatus(accessToken, id, newStatus);
      setOrder((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert("Ошибка смены статуса");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleFormChange = (field) => (e) => {
    let value = e.target.value;

    if (field === "customerPhone") {
      value = value.replace(/[^\d+]/g, "");
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (localId, field, value) => {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.localId !== localId) return item;

        if (field === "quantity") {
          return {
            ...item,
            quantity: Math.max(1, Number(value) || 1),
          };
        }

        if (field === "priceSnapshot") {
          return {
            ...item,
            priceSnapshot: Math.max(0, Number(value) || 0),
          };
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  const handleRemoveItem = (localId) => {
    setEditableItems((prev) => prev.filter((item) => item.localId !== localId));
  };

  const handleCancelEdit = () => {
    if (!order) return;

    setEditMode(false);
    setSaveError("");

    setForm(buildOrderForm(order));

    setEditableItems(
      (order.items || []).map((item, index) => ({
        localId: `${item.id || index}`,
        id: item.id || null,
        productId: item.product_id || item.productId || null,
        productNameSnapshot:
          item.product_name_snapshot || item.productNameSnapshot || "",
        priceSnapshot: Number(item.price_snapshot || item.priceSnapshot || 0),
        quantity: Number(item.quantity || 1),
      }))
    );
  };

  const handleSaveChanges = async () => {
    const normalizedForm = {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim(),
      deliveryAddress: form.deliveryAddress.trim(),
      comment: form.comment.trim(),
    };

    if (
      !normalizedForm.customerName ||
      !normalizedForm.customerPhone ||
      !normalizedForm.customerEmail ||
      normalizedForm.deliveryAddress.length < 3
    ) {
      setSaveError("Проверьте имя, телефон, email и адрес доставки");
      return;
    }

    if (editableItems.length === 0) {
      setSaveError("В заказе должна быть хотя бы одна позиция");
      return;
    }

    setSaving(true);
    setSaveError("");

    const payload = {
      customerName: normalizedForm.customerName,
      customerPhone: normalizedForm.customerPhone,
      customerEmail: normalizedForm.customerEmail,
      deliveryAddress: normalizedForm.deliveryAddress,
      comment: normalizedForm.comment || null,
      items: editableItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productNameSnapshot: item.productNameSnapshot,
        priceSnapshot: Number(item.priceSnapshot),
        quantity: Number(item.quantity),
      })),
    };

    try {
      const updated = await updateOrderDetails(accessToken, id, payload);

      setOrder(updated);
      setForm(buildOrderForm(updated));

      setEditableItems(
        (updated.items || []).map((item, index) => ({
          localId: `${item.id || index}`,
          id: item.id || null,
          productId: item.product_id || item.productId || null,
          productNameSnapshot:
            item.product_name_snapshot || item.productNameSnapshot || "",
          priceSnapshot: Number(item.price_snapshot || item.priceSnapshot || 0),
          quantity: Number(item.quantity || 1),
        }))
      );

      setEditMode(false);
    } catch (err) {
      console.error(err);
      setSaveError(err.message || "Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "Новый",
      CONFIRMED: "Подтверждён",
      PROCESSING: "В обработке",
      SHIPPED: "Отправлен",
      DELIVERED: "Доставлен",
      CANCELLED: "Отменён",
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      PENDING: style.statusPending,
      CONFIRMED: style.statusConfirmed,
      PROCESSING: style.statusProcessing,
      SHIPPED: style.statusShipped,
      DELIVERED: style.statusDelivered,
      CANCELLED: style.statusCancelled,
    };
    return classes[status] || style.statusPending;
  };

  if (loading) {
    return (
      <AdminLayout title="Заказы">
        <p>Загрузка...</p>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout title="Заказы">
        <p style={{ color: "red" }}>{error || "Заказ не найден"}</p>
        <Link to="/admin/orders">← Назад к заказам</Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Заказы">
      <div className={style.page}>
        <Link to="/admin/orders" className={style.backLink}>
          ← Назад к заказам
        </Link>

        <div className={style.header}>
          <div>
            <h1 className={style.pageTitle}>Заказ #{order.id}</h1>
            <p className={style.date}>
              {new Date(order.created_at || order.createdAt).toLocaleString("ru-RU")}
            </p>
          </div>

          <div className={style.headerActions}>
            <span className={`${style.status} ${getStatusClass(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>

            {!isEditLocked && !editMode && (
              <button
                type="button"
                className={`btn ${style.secondaryButton}`}
                onClick={() => {
                  setForm(buildOrderForm(order));
                  setEditMode(true);
                }}
              >
                Редактировать заказ
              </button>
            )}

            {editMode && (
              <div className={style.editActions}>
                <button
                  type="button"
                  className={`btn ${style.secondaryButton}`}
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Отмена
                </button>

                <button
                  type="button"
                  className={`btn btnPrimary`}
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditLocked && (
          <div className={style.lockNotice}>
            Заказ в статусе, где редактирование заблокировано. Доступно только изменение статуса и просмотр.
          </div>
        )}

        <div className={style.grid}>
          <section className={`${style.card} card`}>
            <h2 className={style.sectionTitle}>Покупатель</h2>

            {!editMode ? (
              <div className={style.infoList}>
                <p><strong>Имя:</strong> {order.customer_name || order.customerName || "—"}</p>
                <p><strong>Телефон:</strong> {order.customer_phone || order.customerPhone || "—"}</p>
                <p><strong>Email:</strong> {order.customer_email || order.customerEmail || "—"}</p>
                <p><strong>Адрес:</strong> {order.delivery_address || order.deliveryAddress || "—"}</p>
                {order.comment && <p><strong>Комментарий:</strong> {order.comment}</p>}
              </div>
            ) : (
              <div className={style.formGrid}>
                <div className={style.field}>
                  <label className={style.label}>Имя</label>
                  <input
                    className="input"
                    value={form.customerName}
                    onChange={handleFormChange("customerName")}
                  />
                </div>

                <div className={style.field}>
                  <label className={style.label}>Телефон</label>
                  <input
                    className="input"
                    value={form.customerPhone}
                    onChange={handleFormChange("customerPhone")}
                  />
                </div>

                <div className={style.field}>
                  <label className={style.label}>Email</label>
                  <input
                    className="input"
                    type="email"
                    value={form.customerEmail}
                    onChange={handleFormChange("customerEmail")}
                  />
                </div>

                <div className={`${style.field} ${style.fieldFull}`}>
                  <label className={style.label}>Адрес доставки</label>
                  <input
                    className="input"
                    value={form.deliveryAddress}
                    onChange={handleFormChange("deliveryAddress")}
                  />
                </div>

                <div className={`${style.field} ${style.fieldFull}`}>
                  <label className={style.label}>Комментарий</label>
                  <textarea
                    className="textarea"
                    value={form.comment}
                    onChange={handleFormChange("comment")}
                  />
                </div>
              </div>
            )}
          </section>

          <section className={`${style.card} card`}>
            <h2 className={style.sectionTitle}>Управление статусом</h2>

            <select
              className={`input ${style.select}`}
              value={order.status}
              onChange={handleStatusChange}
              disabled={updating}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <p className={style.helpText}>
              {updating ? "Обновление..." : "Смена статуса происходит сразу"}
            </p>

            <div className={style.summaryBox}>
              <p><strong>Позиций:</strong> {editableItems.length}</p>
              <p><strong>Итого:</strong> {computedTotal} ₽</p>
            </div>
          </section>
        </div>

        <section className={`${style.card} card`}>
          <div className={style.sectionHeader}>
            <h2 className={style.sectionTitle}>Состав заказа</h2>
          </div>

          {saveError && <p className={style.inlineError}>{saveError}</p>}

          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Цена</th>
                  <th>Кол-во</th>
                  <th>Сумма</th>
                  {editMode && !isEditLocked && <th></th>}
                </tr>
              </thead>

              <tbody>
                {editableItems.map((item) => {
                  const lineTotal = Number(item.priceSnapshot || 0) * Number(item.quantity || 0);

                  return (
                    <tr key={item.localId}>
                      <td>
                        {!editMode ? (
                          item.productNameSnapshot
                        ) : (
                          <input
                            className="input"
                            value={item.productNameSnapshot}
                            onChange={(e) =>
                              handleItemChange(item.localId, "productNameSnapshot", e.target.value)
                            }
                          />
                        )}
                      </td>

                      <td>
                        {!editMode ? (
                          `${item.priceSnapshot} ₽`
                        ) : (
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="1"
                            value={item.priceSnapshot}
                            onChange={(e) =>
                              handleItemChange(item.localId, "priceSnapshot", e.target.value)
                            }
                          />
                        )}
                      </td>

                      <td>
                        {!editMode ? (
                          item.quantity
                        ) : (
                          <input
                            className="input"
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(item.localId, "quantity", e.target.value)
                            }
                          />
                        )}
                      </td>

                      <td>{lineTotal} ₽</td>

                      {editMode && !isEditLocked && (
                        <td>
                          <button
                            type="button"
                            className={style.removeButton}
                            onClick={() => handleRemoveItem(item.localId)}
                          >
                            Удалить
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}

                <tr className={style.totalRow}>
                  <td><strong>Итого:</strong></td>
                  <td></td>
                  <td></td>
                  <td><strong>{computedTotal} ₽</strong></td>
                  {editMode && !isEditLocked && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}