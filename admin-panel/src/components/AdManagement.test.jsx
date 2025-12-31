import React from 'react';
import { render, screen } from '@testing-library/react';
import AdManagement from './AdManagement';

describe('AdManagement', () => {
  test('renders AdManagement component', async () => {
    render(<AdManagement />);
    expect(await screen.findByText(/Gestão de Anúncios/i)).toBeInTheDocument();
  });
});
