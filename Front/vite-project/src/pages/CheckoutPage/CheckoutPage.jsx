import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreLayout from "../../layouts/StoreLayout";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import style from "./CheckoutPage.module.css";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getUserAddresses } from "../../api/address";
import { createOrder } from "../../api/order";

function getAddressLabel(address) {
  if (!address) return "";

  return (
    address.fullAddress ||
    address.full_address ||
    address.address ||
    [
      address.country,
      address.region,
      address.city,
      address.street,
      address.house,
      address.building,
      address.entrance ? `подъезд ${address.entrance}` : null,
      address.floor ? `этаж ${address.floor}` : null,
      address.apartment ? `кв. ${address.apartment}` : null,
    ]
      .filter(Boolean)
      .join(", ")
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, sessionId, clearCart } = useCart();
  const { user, tokens, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    comment: "",
  });

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedAddress = useMemo(() => {
    return addresses.find((address) => Number(address.id) === Number(selectedAddressId)) || null;
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
    }));
  }, [user]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated || !tokens?.access_token) {
        setAddresses([]);
        setSelectedAddressId(null);
        setUseSavedAddress(false);
        return;
      }

      setAddressesLoading(true);

      try {
        const data = await getUserAddresses(tokens.access_token);
        const list = Array.isArray(data) ? data : [];

        setAddresses(list);

        if (list.length > 0) {
          const defaultAddress =
            list.find((item) => item.isDefault || item.is_default) || list[0];

          setSelectedAddressId(defaultAddress?.id ?? null);
          setUseSavedAddress(true);
        } else {
          setSelectedAddressId(null);
          setUseSavedAddress(false);
        }
      } catch (error) {
        console.error("Failed to load addresses:", error);
        setAddresses([]);
        setSelectedAddressId(null);
        setUseSavedAddress(false);
      } finally {
        setAddressesLoading(false);
      }
    };

    fetchAddresses();
  }, [isAuthenticated, tokens?.access_token]);

  const handleChange = (field) => (event) => {
    let value = event.target.value;

    if (field === "phone") {
      value = value.replace(/[^\d+]/g, "");
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressModeChange = (useSaved) => {
    setUseSavedAddress(useSaved);
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedForm = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      comment: form.comment.trim(),
    };

    const resolvedDeliveryAddress = useSavedAddress
      ? getAddressLabel(selectedAddress).trim()
      : normalizedForm.address;

    if (!sessionId) {
      setSubmitError("Не найдена сессия корзины");
      return;
    }

    if (items.length === 0) {
      setSubmitError("Корзина пуста");
      return;
    }

    if (!normalizedForm.name || !normalizedForm.phone || !normalizedForm.email) {
      setSubmitError("Заполните данные покупателя");
      return;
    }

    if (!useSavedAddress && !normalizedForm.address) {
      setSubmitError("Укажите адрес доставки");
      return;
    }

    if (useSavedAddress && !selectedAddressId) {
      setSubmitError("Выберите сохранённый адрес");
      return;
    }

    if (!resolvedDeliveryAddress) {
      setSubmitError("Не удалось определить адрес доставки");
      return;
    }

    const payload = {
      sessionId,
      customerName: normalizedForm.name,
      customerPhone: normalizedForm.phone,
      customerEmail: normalizedForm.email,
      comment: normalizedForm.comment || null,
      addressId: useSavedAddress ? selectedAddressId : null,
      deliveryAddress: resolvedDeliveryAddress,
      items: items.map((item) => ({
        productId: item.productId ?? item.id,
        productNameSnapshot: item.name,
        priceSnapshot: item.price,
        quantity: item.quantity,
      })),
    };

    console.log("CREATE ORDER PAYLOAD", payload);

    setSubmitting(true);
    setSubmitError("");

    try {
      const result = await createOrder(
        payload,
        isAuthenticated ? tokens?.access_token : null
      );

      if (clearCart) {
        clearCart();
      }

      navigate("/account", {
        state: {
          orderCreated: true,
          orderNumber: result.orderNumber,
        },
      });
    } catch (error) {
      console.error("CREATE ORDER FAILED:", error);
      setSubmitError(
        error.message || "Не удалось оформить заказ. Попробуйте ещё раз позже."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StoreLayout>
      <section className={style.checkoutPage}>
        <div className="container">
          <Breadcrumbs
            items={[
              { label: "Главная", href: "/" },
              { label: "Корзина", href: "/cart" },
              { label: "Оформление заказа" },
            ]}
          />

          <h1 className="pageTitle">Оформление заказа</h1>

          <div className={style.layout}>
            <div className={style.formBlock}>
              <div className={`${style.card} card`}>
                <h2 className={style.blockTitle}>Данные покупателя</h2>

                <form
                  id="checkout-form"
                  className={style.form}
                  onSubmit={handleSubmit}
                >
                  <div className={style.row}>
                    <div className={style.field}>
                      <label className={style.label}>Имя покупателя *</label>
                      <input
                        type="text"
                        className="input"
                        value={form.name}
                        onChange={handleChange("name")}
                        placeholder="Иван Иванов"
                        required
                      />
                    </div>

                    <div className={style.field}>
                      <label className={style.label}>Телефон *</label>
                      <input
                        type="tel"
                        className="input"
                        value={form.phone}
                        onChange={handleChange("phone")}
                        placeholder="+7 (999) 000-00-00"
                        required
                      />
                    </div>
                  </div>

                  <div className={style.field}>
                    <label className={style.label}>Email *</label>
                    <input
                      type="email"
                      className="input"
                      value={form.email}
                      onChange={handleChange("email")}
                      placeholder="example@mail.ru"
                      required
                    />
                  </div>

                  {isAuthenticated && addresses.length > 0 && (
                    <div className={style.field}>
                      <label className={style.label}>Адрес доставки *</label>

                      <div className={style.addressModeSwitch}>
                        <label>
                          <input
                            type="radio"
                            name="addressMode"
                            checked={useSavedAddress}
                            onChange={() => handleAddressModeChange(true)}
                          />
                          Выбрать сохранённый адрес
                        </label>

                        <label>
                          <input
                            type="radio"
                            name="addressMode"
                            checked={!useSavedAddress}
                            onChange={() => handleAddressModeChange(false)}
                          />
                          Ввести адрес вручную
                        </label>
                      </div>

                      {addressesLoading ? (
                        <p className={style.helperText}>Загрузка адресов...</p>
                      ) : useSavedAddress ? (
                        <select
                          className="input"
                          value={selectedAddressId ?? ""}
                          onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                          required
                        >
                          {addresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {address.label ? `${address.label} — ` : ""}
                              {getAddressLabel(address)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="input"
                          value={form.address}
                          onChange={handleChange("address")}
                          placeholder="Город, улица, дом, квартира"
                          required={!useSavedAddress}
                        />
                      )}

                      {useSavedAddress && selectedAddress && (
                        <p className={style.helperText}>
                          Выбранный адрес: {getAddressLabel(selectedAddress)}
                        </p>
                      )}
                    </div>
                  )}

                  {(!isAuthenticated || addresses.length === 0) && (
                    <div className={style.field}>
                      <label className={style.label}>Адрес доставки *</label>
                      <input
                        type="text"
                        className="input"
                        value={form.address}
                        onChange={handleChange("address")}
                        placeholder="Город, улица, дом, квартира"
                        required
                      />
                    </div>
                  )}

                  <div className={style.field}>
                    <label className={style.label}>Комментарий к заказу</label>
                    <textarea
                      className="textarea"
                      value={form.comment}
                      onChange={handleChange("comment")}
                      placeholder="Дополнительные пожелания..."
                    />
                  </div>

                  {submitError && (
                    <p className={style.errorText}>{submitError}</p>
                  )}
                </form>
              </div>
            </div>

            <aside className={style.summary}>
              <div className={`${style.summaryCard} card`}>
                <h2 className={style.blockTitle}>Состав заказа</h2>

                {items.length === 0 ? (
                  <p className={style.emptyText}>
                    Ваша корзина пуста. Добавьте товары перед оформлением заказа.
                  </p>
                ) : (
                  <>
                    {items.map((item) => (
                      <div key={item.id} className={style.productLine}>
                        <div>
                          <p className={style.productTitle}>{item.name}</p>
                          <p className={style.productMeta}>
                            {item.quantity} x {item.price} ₽
                          </p>
                        </div>
                        <span className={style.productPrice}>
                          {item.price * item.quantity} ₽
                        </span>
                      </div>
                    ))}

                    <div className={style.totalRow}>
                      <span>Итого:</span>
                      <span>{totalPrice} ₽</span>
                    </div>

                    <button
                      type="submit"
                      form="checkout-form"
                      className={`btn btnPrimary ${style.submitButton}`}
                      disabled={submitting}
                    >
                      {submitting ? "Оформляем..." : "Подтвердить заказ"}
                    </button>

                    <p className={style.policyText}>
                      Нажимая «Подтвердить», вы соглашаетесь с условиями обработки
                      персональных данных
                    </p>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}