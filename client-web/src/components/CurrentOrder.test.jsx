import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CurrentOrder from './CurrentOrder';
import * as socketModule from '../services/socket';

// Mock the centralized socket subscribe API
jest.mock('../services/socket', () => ({
  subscribeToEvent: jest.fn(() => jest.fn()), // returns unsubscribe function
}));

describe('CurrentOrder ORDER_STATUS_UPDATE -> completed', () => {
  let clearSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    clearSpy = jest.spyOn(global, 'clearInterval');

    // Minimal WebSocket stub to avoid crashes from CurrentOrder's own WS
    global.WebSocket = class {
      constructor() {
        this.readyState = 1;
        this.onmessage = null;
        this.close = jest.fn();
      }
    };

    // Ensure clean storage between tests
    window.sessionStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('stops timers, shows toast and renders "Pronto" when order completes', async () => {
    const orderId = 777;

    // Preload session state so the component mounts with an active order and running timers
    window.sessionStorage.setItem('currentOrderId', String(orderId));
    window.sessionStorage.setItem('currentPrepSeconds', '120');
    window.sessionStorage.setItem('currentCancelUntil', new Date(Date.now() + 60_000).toISOString());

    render(
      <>
        <ToastContainer />
        <CurrentOrder />
      </>
    );

    // Wait until the component shows the prep-time area, meaning timers likely started
    expect(await screen.findByText(/Tempo de preparo/i)).toBeInTheDocument();

    const beforeClears = clearSpy.mock.calls.length;

    // Grab the ORDER_STATUS_UPDATE handler from our mocked subscribeToEvent calls
    const subscribeCalls = socketModule.subscribeToEvent.mock.calls;
    const statusHandler = subscribeCalls.find(([type]) => type === 'ORDER_STATUS_UPDATE')?.[1];
    expect(typeof statusHandler).toBe('function');

    // Emit the completion event for this order
    statusHandler({ id: orderId, status: 'completed' });

    // The toast should appear with the success message
    await waitFor(() => {
      expect(screen.getByText('Seu prato está pronto e a caminho!')).toBeInTheDocument();
    });

    // UI should switch to the "Pronto" badge
    expect(screen.getByText('Pronto')).toBeInTheDocument();

    // Timers should have been stopped at least once (clearInterval called)
    expect(clearSpy.mock.calls.length).toBeGreaterThan(beforeClears);
  });
});

