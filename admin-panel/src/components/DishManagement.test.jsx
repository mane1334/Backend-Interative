import React from 'react';
import { render, screen } from '@testing-library/react';
import DishManagement from './DishManagement';

describe('DishManagement', () => {
  test('renders DishManagement component', async () => {
    render(<DishManagement />);
    expect(await screen.findByText(/Gestão de Cardápio/i)).toBeInTheDocument();
  });
});
