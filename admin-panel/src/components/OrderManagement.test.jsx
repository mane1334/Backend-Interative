import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderManagement from './OrderManagement';

describe('OrderManagement', () => {
  test('renders OrderManagement component', async () => {
    render(<OrderManagement />);
    expect(await screen.findByText(/Gestão de Pedidos em Tempo Real/i)).toBeInTheDocument();
  });
});
