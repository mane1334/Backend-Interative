import { useEffect } from 'react';
import { subscribeToEvent } from '../services/socket';

// useOrderStatus hook
// - Subscribes to ORDER_STATUS_UPDATE events from the central socket layer
// - Filters by the given orderId
// - Invokes onUpdate(newStatus) when an event arrives
// - Cleans up on unmount
export default function useOrderStatus(orderId, onUpdate) {
  useEffect(() => {
    if (!orderId || typeof onUpdate !== 'function') return;

    const unsubscribe = subscribeToEvent('ORDER_STATUS_UPDATE', (payload) => {
      try {
        if (!payload) return;
        // payload comes from backend as entire order row; expecting payload.id and payload.status
        if (Number(payload.id) === Number(orderId) && payload.status) {
          onUpdate(payload.status, payload);
        }
      } catch (_) {}
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [orderId, onUpdate]);
}

