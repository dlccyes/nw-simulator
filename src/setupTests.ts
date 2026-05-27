import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';

// Provide a default API base for tests
// Vitest replaces import.meta.env.* at transform time; but our env util falls back safely.
// If any code reads from this, it's defined.
(globalThis as { __VITE_API_BASE_URL__?: string }).__VITE_API_BASE_URL__ = 'http://localhost:5000';

// Recharts is heavy and not needed for logic in our tests; mock to lightweight stubs
vi.mock('recharts', () => {
  const Stub = () => null;
  return {
    ComposedChart: Stub,
    Line: Stub,
    XAxis: Stub,
    YAxis: Stub,
    CartesianGrid: Stub,
    Tooltip: Stub,
    Legend: Stub,
    ResponsiveContainer: ({ children }: { children?: ReactNode }) => children,
    ReferenceLine: Stub,
    PieChart: Stub,
    Pie: Stub,
    Cell: Stub,
  };
});

// Ensure DOM is reset between tests to avoid cross-test interference
afterEach(() => {
  cleanup();
});
