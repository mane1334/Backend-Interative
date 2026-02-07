import { useState, useCallback } from 'react';
import { Dish, CartItem } from '../types';

interface UseCartReturn {
    cart: CartItem[];
    addToCart: (dish: Dish, quantity?: number) => void;
    removeFromCart: (id: number) => void;
    changeQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
}

export const useCart = (): UseCartReturn => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = useCallback((dish: Dish, quantity: number = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === dish.id);
            if (existing) {
                return prev.map(item =>
                    item.id === dish.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { ...dish, quantity }];
        });
    }, []);

    const removeFromCart = useCallback((id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    }, []);

    const changeQuantity = useCallback((id: number, quantity: number) => {
        if (quantity < 1) return;
        setCart(prev =>
            prev.map(item => (item.id === id ? { ...item, quantity } : item))
        );
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
        cart,
        addToCart,
        removeFromCart,
        changeQuantity,
        clearCart,
        total,
        itemCount,
    };
};

export default useCart;
