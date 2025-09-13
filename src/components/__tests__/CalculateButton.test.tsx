import { render, screen, fireEvent } from '@testing-library/react';
import CalculateButton from '../CalculateButton';

describe('CalculateButton', () => {
  it('renders with default label', () => {
    render(<CalculateButton loading={false} onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument();
  });

  it('shows spinner and is disabled when loading', () => {
    render(<CalculateButton loading={true} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<CalculateButton loading={false} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});

