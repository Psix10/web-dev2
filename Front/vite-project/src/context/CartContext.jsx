import { createContext, useContext, useMemo, useReducer } from "react";

const CartContext = createContext(null);

const initialState = {
    items: [],
};

function cartReducer(state, action) {
    switch (action.type) {
        case "ADD_TO_CART": {
        const existingItem = state.items.find(
            (item) => item.id === action.payload.id
        );

        if (existingItem) {
            return {
            ...state,
            items: state.items.map((item) =>
                item.id === action.payload.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
            };
        }

        return {
            ...state,
            items: [...state.items, { ...action.payload, quantity: 1 }],
        };
        }

        case "REMOVE_FROM_CART":
        return {
            ...state,
            items: state.items.filter((item) => item.id !== action.payload),
        };

        case "INCREASE_QUANTITY":
        return {
            ...state,
            items: state.items.map((item) =>
            item.id === action.payload
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
        };

        case "DECREASE_QUANTITY":
        return {
            ...state,
            items: state.items
            .map((item) =>
                item.id === action.payload
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            .filter((item) => item.quantity > 0),
        };

        case "CLEAR_CART":
        return {
            ...state,
            items: [],
        };

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
    }, [state.items]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }

    return context;
}