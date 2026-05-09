import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import StoreLayout from "../../layouts/StoreLayout";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import style from "./AccountPage.module.css";
import { useAuth } from "../../context/AuthContext";
import { getUserAddresses, createUserAddress } from "../../api/address";
import { getMyOrders } from "../../api/order";
import { updateMyProfile } from "../../api/auth";

const initialAddressForm = {
  label: "",
  city: "",
  street: "",
  house: "",
  apartment: "",
  entrance: "",
  floor: "",
  intercom: "",
  comment: "",
  isDefault: false,
};

export default function AccountPage() {
    const { user, tokens, isAuthenticated, logout, refreshUser } = useAuth();
    const navigate = useNavigate();

    // Orders state
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState("");
    const [openedOrderId, setOpenedOrderId] = useState(null);

    // Addresses state
    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [addressesError, setAddressesError] = useState("");

    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [addressSubmitting, setAddressSubmitting] = useState(false);
    const [addressError, setAddressError] = useState("");
    const [addressSuccess, setAddressSuccess] = useState("");
    const [addressForm, setAddressForm] = useState(initialAddressForm);

    // Profile state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileSubmitting, setProfileSubmitting] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState("");

    const [profileForm, setProfileForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
    });

    // Load user profile data
    useEffect(() => {
        if (!user) return;

        setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        });
    }, [user]);

    // Load addresses
    useEffect(() => {
        const fetchAddresses = async () => {
        if (!tokens?.access_token) return;

        setAddressesLoading(true);
        setAddressesError("");

        try {
            const data = await getUserAddresses(tokens.access_token);
            setAddresses(data || []);
        } catch (error) {
            console.error("Failed to load addresses:", error);
            setAddressesError(error.message || "Не удалось загрузить адреса");
            setAddresses([]);
        } finally {
            setAddressesLoading(false);
        }
        };

        if (isAuthenticated) {
        fetchAddresses();
        }
    }, [isAuthenticated, tokens?.access_token]);

    // Load orders
    useEffect(() => {
        const fetchOrders = async () => {
        if (!tokens?.access_token) return;

        setOrdersLoading(true);
        setOrdersError("");

        try {
            const data = await getMyOrders(tokens.access_token);
            setOrders(data || []);
        } catch (error) {
            console.error("Failed to load orders:", error);
            setOrdersError(error.message || "Не удалось загрузить заказы");
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
        };

        if (isAuthenticated) {
        fetchOrders();
        }
    }, [isAuthenticated, tokens?.access_token]);

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    const toggleOrder = (id) => {
        setOpenedOrderId((prev) => (prev === id ? null : id));
    };

    const handleProfileChange = (field) => (event) => {
        let value = event.target.value;

        if (field === "phone") {
        value = value.replace(/[^\d+]/g, "");
        }

        setProfileForm((prev) => ({
        ...prev,
        [field]: value,
        }));
    };

    const handleCancelProfileEdit = () => {
        setProfileError("");
        setProfileSuccess("");
        setIsEditingProfile(false);
        setProfileForm({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: user?.phone || "",
        });
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();
        setProfileError("");
        setProfileSuccess("");

        if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
        setProfileError("Имя и фамилия обязательны");
        return;
        }

        try {
        setProfileSubmitting(true);

        await updateMyProfile(tokens.access_token, {
            first_name: profileForm.firstName.trim(),
            last_name: profileForm.lastName.trim(),
            phone: profileForm.phone.trim() || null,
        });

        await refreshUser(tokens.access_token);
        setProfileSuccess("Данные профиля обновлены");
        setIsEditingProfile(false);
        } catch (error) {
        setProfileError(error.message || "Не удалось обновить профиль");
        } finally {
        setProfileSubmitting(false);
        }
    };

    const handleAddressChange = (field) => (event) => {
        const value =
        field === "isDefault" ? event.target.checked : event.target.value;

        setAddressForm((prev) => ({
        ...prev,
        [field]: value,
        }));
    };

    const handleCancelAddress = () => {
        setIsAddingAddress(false);
        setAddressError("");
        setAddressSuccess("");
        setAddressForm(initialAddressForm);
    };

    const buildFullAddress = (address) => {
        return [
        address.city,
        address.street,
        address.house ? `д. ${address.house}` : "",
        address.apartment ? `кв. ${address.apartment}` : "",
        ]
        .filter(Boolean)
        .join(", ");
    };

    const handleAddressSubmit = async (event) => {
        event.preventDefault();
        setAddressError("");
        setAddressSuccess("");

        if (
        !addressForm.city.trim() ||
        !addressForm.street.trim() ||
        !addressForm.house.trim()
        ) {
        setAddressError("Заполните город, улицу и дом");
        return;
        }

        try {
        setAddressSubmitting(true);

        const payload = {
            label: addressForm.label.trim() || null,
            city: addressForm.city.trim(),
            street: addressForm.street.trim(),
            house: addressForm.house.trim(),
            apartment: addressForm.apartment.trim() || null,
            entrance: addressForm.entrance.trim() || null,
            floor: addressForm.floor.trim() || null,
            intercom: addressForm.intercom.trim() || null,
            comment: addressForm.comment.trim() || null,
            is_default: addresses.length === 0 ? true : addressForm.isDefault,
            full_address: buildFullAddress(addressForm),
        };

        await createUserAddress(payload, tokens.access_token);
        const updatedAddresses = await getUserAddresses(tokens.access_token);
        setAddresses(updatedAddresses || []);
        setAddressSuccess("Адрес успешно добавлен");
        setAddressForm(initialAddressForm);
        setIsAddingAddress(false);
        } catch (error) {
        setAddressError(error.message || "Не удалось добавить адрес");
        } finally {
        setAddressSubmitting(false);
        }
    };

    const formatOrderStatus = (status) => {
        switch (status) {
        case "NEW":
            return "Новый";
        case "PROCESSING":
            return "В обработке";
        case "COMPLETED":
            return "Доставлен";
        case "CANCELLED":
            return "Отменён";
        default:
            return status || "—";
        }
    };

    return (
        <StoreLayout>
        <section className={style.accountPage}>
            <div className="container">
            <Breadcrumbs
                items={[
                { label: "Главная", href: "/" },
                { label: "Личный кабинет" },
                ]}
            />

            <div className={style.hero}>
                <div>
                <p className={style.eyebrow}>Профиль пользователя</p>
                <h1 className={style.title}>Личный кабинет</h1>
                <p className={style.subtitle}>
                    Здесь вы можете просматривать заказы, управлять адресами и быстро
                    возвращаться к покупкам
                </p>
                </div>

                <Link to="/catalog" className={`btn btnPrimary ${style.heroButton}`}>
                Перейти в каталог
                </Link>
            </div>

            <div className={style.layout}>
                <aside className={style.sidebar}>
                <div className={`${style.profileCard} card`}>
                    <div className={style.avatar}>
                    {(
                        user.firstName?.slice(0, 1) ||
                        user.email?.slice(0, 1) ||
                        "U"
                    ).toUpperCase()}
                    </div>

                    <h2 className={style.userName}>{user.name || user.email}</h2>

                    <div className={style.userMeta}>
                    <p>{user.email}</p>
                    {user.phone && <p>{user.phone}</p>}
                    </div>

                    <div className={style.sidebarActions}>
                    <button
                        type="button"
                        className={style.logoutButton}
                        onClick={() => {
                        logout();
                        navigate("/");
                        }}
                    >
                        Выйти
                    </button>
                    </div>
                </div>

                <div className={`${style.addressCard} card`}>
                    <div className={style.infoCardHead}>
                    <h3 className={style.cardTitle}>Мои адреса доставки</h3>

                    {!isAddingAddress && (
                        <button
                        type="button"
                        className={style.editButton}
                        onClick={() => {
                            setAddressError("");
                            setAddressSuccess("");
                            setIsAddingAddress(true);
                        }}
                        >
                        Добавить адрес
                        </button>
                    )}
                    </div>

                    {addressesLoading ? (
                    <p className={style.addressText}>Загрузка адресов...</p>
                    ) : addressesError ? (
                    <p className={style.addressError}>{addressesError}</p>
                    ) : addresses.length === 0 ? (
                    <p className={style.addressText}>
                        У вас пока нет сохранённых адресов. Добавьте первый адрес
                        ниже.
                    </p>
                    ) : (
                    <div className={style.addressList}>
                        {addresses.map((address) => (
                        <div key={address.id} className={style.addressItem}>
                            <p className={style.addressLabel}>
                            {address.label || `Адрес #${address.id}`}
                            </p>
                            <p className={style.addressText}>
                            {address.fullAddress || address.full_address}
                            </p>
                            {(address.isDefault || address.is_default) && (
                            <span className={style.defaultBadge}>
                                По умолчанию
                            </span>
                            )}
                        </div>
                        ))}
                    </div>
                    )}

                    {addressSuccess && (
                    <p className={style.successText}>{addressSuccess}</p>
                    )}

                    {isAddingAddress && (
                    <form className={style.profileForm} onSubmit={handleAddressSubmit}>
                        <div className={style.field}>
                        <label className={style.label}>Название адреса</label>
                        <input
                            type="text"
                            className="input"
                            value={addressForm.label}
                            onChange={handleAddressChange("label")}
                            placeholder="Например: Дом, Работа"
                        />
                        </div>

                        <div className={style.field}>
                        <label className={style.label}>Город *</label>
                        <input
                            type="text"
                            className="input"
                            value={addressForm.city}
                            onChange={handleAddressChange("city")}
                            placeholder="Москва"
                        />
                        </div>

                        <div className={style.field}>
                        <label className={style.label}>Улица *</label>
                        <input
                            type="text"
                            className="input"
                            value={addressForm.street}
                            onChange={handleAddressChange("street")}
                            placeholder="ул. Ленина"
                        />
                        </div>

                        <div className={style.field}>
                        <label className={style.label}>Дом *</label>
                        <input
                            type="text"
                            className="input"
                            value={addressForm.house}
                            onChange={handleAddressChange("house")}
                            placeholder="10"
                        />
                        </div>

                        <div className={style.field}>
                        <label className={style.label}>Квартира</label>
                        <input
                            type="text"
                            className="input"
                            value={addressForm.apartment}
                            onChange={handleAddressChange("apartment")}
                            placeholder="25"
                        />
                        </div>

                        <div className={style.field}>
                        <label className={style.label}>Подъезд</label>
                        <input
                            type="text"
                            className="input"
                            value={addressForm.entrance}
                            onChange={handleAddressChange("entrance")}
                            placeholder="2"
                        />
                        </div>

                        <div className={style.field}>
                        <label className={style.label}>Этаж</label>
                        <input
                            type="text"
                            className="input"
                            value={addressForm.floor}
                            onChange={handleAddressChange("floor")}
                            placeholder="6"
                        />
                        </div>

                        <div className={style.field}>
                        <label className={style.label}>Домофон</label>
                        <input
                            type="text"
                            className="input"
                            value={addressForm.intercom}
                            onChange={handleAddressChange("intercom")}
                            placeholder="125"
                        />
                        </div>

                        <div className={style.field}>
                        <label className={style.label}>Комментарий курьеру</label>
                        <textarea
                            className="textarea"
                            value={addressForm.comment}
                            onChange={handleAddressChange("comment")}
                            placeholder="Позвонить за 10 минут"
                        />
                        </div>

                        {addresses.length > 0 && (
                        <label className={style.checkboxRow}>
                            <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={handleAddressChange("isDefault")}
                            />
                            Сделать адресом по умолчанию
                        </label>
                        )}

                        {addressError && (
                        <p className={style.errorText}>{addressError}</p>
                        )}

                        <div className={style.formActions}>
                        <button
                            type="submit"
                            className={`btn btnPrimary ${style.saveButton}`}
                            disabled={addressSubmitting}
                        >
                            {addressSubmitting ? "Сохраняем..." : "Сохранить адрес"}
                        </button>

                        <button
                            type="button"
                            className={style.cancelButton}
                            onClick={handleCancelAddress}
                            disabled={addressSubmitting}
                        >
                            Отмена
                        </button>
                        </div>
                    </form>
                    )}
                </div>
                </aside>

                <div className={style.content}>
                <div className={`${style.ordersCard} card`}>
                    <div className={style.sectionHead}>
                    <h2 className={style.sectionTitle}>Мои заказы</h2>
                    {!ordersLoading && !ordersError && (
                        <span className={style.ordersCount}>{orders.length}</span>
                    )}
                    </div>

                    {ordersLoading ? (
                    <div className={style.emptyState}>
                        <p className={style.emptyTitle}>Загрузка заказов...</p>
                        <p className={style.emptyText}>
                        Подождите немного, мы получаем список ваших заказов
                        </p>
                    </div>
                    ) : ordersError ? (
                    <div className={style.emptyState}>
                        <p className={style.emptyTitle}>Не удалось загрузить заказы</p>
                        <p className={style.emptyText}>{ordersError}</p>
                    </div>
                    ) : orders.length === 0 ? (
                    <div className={style.emptyState}>
                        <p className={style.emptyTitle}>У вас пока нет заказов</p>
                        <p className={style.emptyText}>
                        Перейдите в каталог и добавьте товары в корзину
                        </p>
                        <Link
                        to="/catalog"
                        className={`btn btnPrimary ${style.emptyButton}`}
                        >
                        Открыть каталог
                        </Link>
                    </div>
                    ) : (
                    <div className={style.ordersList}>
                        {orders.map((order) => {
                        const isOpen = openedOrderId === order.id;
                        const items = order.items || [];
                        const createdAt = order.createdAt || order.created_at;
                        const orderNumber = order.orderNumber || order.order_number;
                        const totalAmount = order.totalAmount || order.total_amount;
                        const deliveryAddress =
                            order.deliveryAddress || order.delivery_address;

                        return (
                            <div key={order.id} className={style.orderItem}>
                            <div className={style.orderMain}>
                                <div>
                                <p className={style.orderId}>Заказ {orderNumber}</p>
                                <p className={style.orderMeta}>
                                    {createdAt
                                    ? new Date(createdAt).toLocaleDateString("ru-RU")
                                    : "—"}{" "}
                                    · {items.length}{" "}
                                    {items.length === 1
                                    ? "товар"
                                    : items.length >= 2 && items.length <= 4
                                    ? "товара"
                                    : "товаров"}
                                </p>
                                </div>

                                <span
                                className={`${style.status} ${
                                    order.status === "COMPLETED"
                                    ? style.statusDelivered
                                    : style.statusProcessing
                                }`}
                                >
                                {formatOrderStatus(order.status)}
                                </span>
                            </div>

                            <div className={style.orderBottom}>
                                <span className={style.orderTotal}>
                                {Number(totalAmount || 0).toLocaleString("ru-RU")} ₽
                                </span>

                                <button
                                type="button"
                                className={style.detailsButton}
                                onClick={() => toggleOrder(order.id)}
                                >
                                {isOpen ? "Скрыть" : "Подробнее"}
                                </button>
                            </div>

                            {isOpen && (
                                <div className={style.orderDetails}>
                                <p className={style.detailsTitle}>Состав заказа</p>

                                <ul className={style.productsList}>
                                    {items.map((item, index) => {
                                        const productName =
                                        item.productNameSnapshot || item.product_name_snapshot || "Товар";

                                        const quantity = Number(item.quantity || 0);
                                        const price = Number(item.priceSnapshot || item.price_snapshot || 0);
                                        const lineTotal = price * quantity;

                                        return (
                                        <li
                                            key={
                                            item.id || `${item.product_id || item.productId}-${index}`
                                            }
                                            className={style.productItem}
                                        >
                                            <div className={style.productRow}>
                                            <div className={style.productInfo}>
                                                <p className={style.productName}>{productName}</p>
                                                <p className={style.productMeta}>
                                                {price.toLocaleString("ru-RU")} ₽ × {quantity} шт.
                                                </p>
                                            </div>

                                            <div className={style.productSum}>
                                                {lineTotal.toLocaleString("ru-RU")} ₽
                                            </div>
                                            </div>
                                        </li>
                                        );
                                    })}
                                    </ul>

                                {deliveryAddress && (
                                    <p className={style.addressText}>
                                    <strong>Адрес доставки:</strong> {deliveryAddress}
                                    </p>
                                )}

                                {order.comment && (
                                    <p className={style.addressText}>
                                    <strong>Комментарий:</strong> {order.comment}
                                    </p>
                                )}
                                </div>
                            )}
                            </div>
                        );
                        })}
                    </div>
                    )}
                </div>

                <div className={style.bottomGrid}>
                    <div className={`${style.infoCard} card`}>
                    <div className={style.infoCardHead}>
                        <h3 className={style.cardTitle}>Данные аккаунта</h3>

                        {!isEditingProfile && (
                        <button
                            type="button"
                            className={style.editButton}
                            onClick={() => {
                            setProfileError("");
                            setProfileSuccess("");
                            setIsEditingProfile(true);
                            }}
                        >
                            Редактировать
                        </button>
                        )}
                    </div>

                    {!isEditingProfile ? (
                        <>
                        <div className={style.infoList}>
                            <div className={style.infoRow}>
                            <span>Имя</span>
                            <span>
                                {[user.firstName, user.lastName]
                                .filter(Boolean)
                                .join(" ") || "—"}
                            </span>
                            </div>

                            <div className={style.infoRow}>
                            <span>Email</span>
                            <span>{user.email}</span>
                            </div>

                            <div className={style.infoRow}>
                            <span>Телефон</span>
                            <span>{user.phone || "—"}</span>
                            </div>

                            <div className={style.infoRow}>
                            <span>Статус</span>
                            <span>
                                {user.isVerified ? "Подтверждён" : "Не подтверждён"}
                            </span>
                            </div>
                        </div>

                        {profileSuccess && (
                            <p className={style.successText}>{profileSuccess}</p>
                        )}
                        </>
                    ) : (
                        <form className={style.profileForm} onSubmit={handleProfileSubmit}>
                        <div className={style.field}>
                            <label className={style.label}>Имя</label>
                            <input
                            type="text"
                            className="input"
                            value={profileForm.firstName}
                            onChange={handleProfileChange("firstName")}
                            placeholder="Введите имя"
                            />
                        </div>

                        <div className={style.field}>
                            <label className={style.label}>Фамилия</label>
                            <input
                            type="text"
                            className="input"
                            value={profileForm.lastName}
                            onChange={handleProfileChange("lastName")}
                            placeholder="Введите фамилию"
                            />
                        </div>

                        <div className={style.field}>
                            <label className={style.label}>Телефон</label>
                            <input
                            type="tel"
                            className="input"
                            value={profileForm.phone}
                            onChange={handleProfileChange("phone")}
                            placeholder="+79991234567"
                            />
                        </div>

                        <div className={style.infoRow}>
                            <span>Email</span>
                            <span>{user.email}</span>
                        </div>

                        <div className={style.infoRow}>
                            <span>Статус</span>
                            <span>
                            {user.isVerified ? "Подтверждён" : "Не подтверждён"}
                            </span>
                        </div>

                        {profileError && (
                            <p className={style.errorText}>{profileError}</p>
                        )}
                        {profileSuccess && (
                            <p className={style.successText}>{profileSuccess}</p>
                        )}

                        <div className={style.formActions}>
                            <button
                            type="submit"
                            className={`btn btnPrimary ${style.saveButton}`}
                            disabled={profileSubmitting}
                            >
                            {profileSubmitting ? "Сохраняем..." : "Сохранить"}
                            </button>

                            <button
                            type="button"
                            className={style.cancelButton}
                            onClick={handleCancelProfileEdit}
                            disabled={profileSubmitting}
                            >
                            Отмена
                            </button>
                        </div>
                        </form>
                    )}
                    </div>

                    <div className={`${style.infoCard} card`}>
                    <h3 className={style.cardTitle}>Быстрые действия</h3>

                    <div className={style.quickActions}>
                        <Link to="/catalog" className={style.quickLink}>
                        Перейти в каталог
                        </Link>

                        <Link to="/cart" className={style.quickLink}>
                        Открыть корзину
                        </Link>

                        <Link to="/checkout" className={style.quickLink}>
                        Оформить заказ
                        </Link>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </section>
        </StoreLayout>
    );
}
