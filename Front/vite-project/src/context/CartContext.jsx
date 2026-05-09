import { createContext, useContext, useMemo, useReducer } from "react";

const CartContext = createContext(null);

function generateSessionId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getInitialSessionId() {
    const storedSessionId = localStorage.getItem("cart_session_id");

    if (storedSessionId) {
        return storedSessionId;
    }

    const newSessionId = generateSessionId();
    localStorage.setItem("cart_session_id", newSessionId);
    return newSessionId;
}

function getInitialItems() {
    const storedCart = localStorage.getItem("cart_items");

    if (!storedCart) {
        return [];
    }

    try {
        return JSON.parse(storedCart);
    } catch {
        return [];
    }
}

const initialState = {
    sessionId: getInitialSessionId(),
    items: getInitialItems(),
};

function persistCart(state) {
    localStorage.setItem("cart_items", JSON.stringify(state.items));
    localStorage.setItem("cart_session_id", state.sessionId);
}

function cartReducer(state, action) {
    switch (action.type) {
        case "ADD_TO_CART": {
        const existingItem = state.items.find(
            (item) => item.id === action.payload.id
        );

        let nextState;

        if (existingItem) {
            nextState = {
            ...state,
            items: state.items.map((item) =>
                item.id === action.payload.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
            };
        } else {
            nextState = {
            ...state,
            items: [...state.items, { ...action.payload, quantity: 1 }],
            };
        }

        persistCart(nextState);
        return nextState;
        }

        case "REMOVE_FROM_CART": {
        const nextState = {
            ...state,
            items: state.items.filter((item) => item.id !== action.payload),
        };

        persistCart(nextState);
        return nextState;
        }

        case "INCREASE_QUANTITY": {
        const nextState = {
            ...state,
            items: state.items.map((item) =>
            item.id === action.payload
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
        };

        persistCart(nextState);
        return nextState;
        }

        case "DECREASE_QUANTITY": {
        const nextState = {
            ...state,
            items: state.items
            .map((item) =>
                item.id === action.payload
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            .filter((item) => item.quantity > 0),
        };

        persistCart(nextState);
        return nextState;
        }

        case "CLEAR_CART": {
        const nextState = {
            ...state,
            items: [],
        };

        persistCart(nextState);
        return nextState;
        }

        default:
        return state;
    }
}

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    const value = useMemo(() => {
        const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = state.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
        );

        return {
        sessionId: state.sessionId,
        items: state.items,
        totalItems,
        totalPrice,
        addToCart: (product) =>
            dispatch({ type: "ADD_TO_CART", payload: product }),
        removeFromCart: (id) =>
            dispatch({ type: "REMOVE_FROM_CART", payload: id }),
        increaseQuantity: (id) =>
            dispatch({ type: "INCREASE_QUANTITY", payload: id }),
        decreaseQuantity: (id) =>
            dispatch({ type: "DECREASE_QUANTITY", payload: id }),
        clearCart: () => dispatch({ type: "CLEAR_CART" }),
        };
    }, [state]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }

    return context;
}