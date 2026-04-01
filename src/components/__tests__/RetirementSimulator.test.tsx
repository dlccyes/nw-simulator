import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RetirementSimulator from '../RetirementSimulator';

describe('RetirementSimulator', () => {
  it('renders retirement simulator component', () => {
    render(
      <BrowserRouter>
        <RetirementSimulator />
      </BrowserRouter>
    );
    
    // Check for main heading
    expect(screen.getByText('Retirement Simulator')).toBeDefined();
    
    // Check for key input fields
    expect(screen.getByLabelText(/Current Age/i)).toBeDefined();
    expect(screen.getByLabelText(/Retirement Age/i)).toBeDefined();
    expect(screen.getByLabelText(/Traditional IRA/i)).toBeDefined();
    expect(screen.getByLabelText(/Roth IRA/i)).toBeDefined();
    
    // Check for calculate button
    expect(screen.getByText(/Calculate Retirement Plan/i)).toBeDefined();
  });
});
