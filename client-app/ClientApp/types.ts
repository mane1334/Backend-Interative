export interface Dish {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    category_name?: string;
    average_rating?: number;
    preparation_time?: number; // Added
    [key: string]: any;
}

export interface CartItem extends Dish {
    quantity: number;
}

export interface AdItem {
    id: number;
    image_url: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    [k: string]: any;
}

export interface Order {
    id: number;
    prepSeconds: number;
    cancelUntil?: string;
}

export interface Settings {
    restaurant_name?: string;
    opening_hours?: string;
    closing_hours?: string;
    inactivity_timeout_minutes?: number;
    [key: string]: any;
}
