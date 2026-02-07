export const isRestaurantOpen = (openTime?: string, closeTime?: string): boolean => {
    if (!openTime || !closeTime) return true; // Assume open if no hours set

    try {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [openHour, openMinute] = openTime.split(':').map(Number);
        const [closeHour, closeMinute] = closeTime.split(':').map(Number);

        const startMinutes = openHour * 60 + (openMinute || 0);
        const endMinutes = closeHour * 60 + (closeMinute || 0);

        if (endMinutes < startMinutes) {
            // Crosses midnight (e.g. 18:00 to 02:00)
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } catch (e) {
        console.error("Error parsing opening hours", e);
        return true;
    }
};
