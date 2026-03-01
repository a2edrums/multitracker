import { render, screen } from '@testing-library/react';
import App from './App';

test('renders initializing state', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Initializing Database/i);
  expect(loadingElement).toBeInTheDocument();
});
