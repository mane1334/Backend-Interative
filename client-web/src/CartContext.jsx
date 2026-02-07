import React, { createContext, useContext, useEffect, useReducer } from 'react';

const CartStateContext = createContext(null);
const CartDispatchContext = createContext(null);

const CART_STORAGE_KEY = 'interactive_cart';

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { dish } = action;
      const existing = state.find(i => i.id === dish.id);
      if (existing) {
        return state.map(i => i.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...state, { ...dish, quantity: 1 }];
    }
    case 'REMOVE_ITEM': {
      return state.filter(i => i.id !== action.id);
    }
    case 'CHANGE_QUANTITY': {
      return state.map(i => i.id === action.id ? { ...i, quantity: Math.max(1, action.quantity) } : i);
    }
    case 'CLEAR': {
      return [];
    }
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, [], (initial) => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : initial;
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <CartStateContext.Provider value={state}>
      <CartDispatchContext.Provider value={dispatch}>
        {children}
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
};

export const useCartState = () => {
    const ctx = useContext(CartStateContext);
    if (!ctx) throw new Error('useCartState must be used within CartProvider');
    return ctx;
};
export const useCartDispatch = () => {
    const ctx = useContext(CartDispatchContext);
    if (!ctx) throw new Error('useCartDispatch must be used within CartProvider');
    return ctx;
};