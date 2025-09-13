import { render, screen, fireEvent } from '@testing-library/react';
import DarkModeToggle from '../DarkModeToggle';

describe('DarkModeToggle', () => {
  it('renders and toggles', () => {
    const onToggle = vi.fn();
    render(<DarkModeToggle darkMode={false} onToggle={onToggle} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalled();
  });
});

