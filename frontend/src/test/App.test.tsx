import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { App } from '../App';

// Mock WebSocket
vi.mock('../services/websocket', () => ({
  wsService: {
    connect: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    send: vi.fn(),
  },
}));

// Mock fetch APIs
vi.mock('../services/api', () => ({
  api: {
    getDashboardSummary: vi.fn().mockResolvedValue({
      device: { connected: false },
      session: { active: false },
      presentation: null,
      recent_sessions: [],
    }),
    getDeviceStatus: vi.fn().mockResolvedValue({ connected: false }),
    getPresentationState: vi.fn().mockResolvedValue({ presentation_loaded: false }),
    getActiveSession: vi.fn().mockResolvedValue({ active: false }),
    listPresentations: vi.fn().mockResolvedValue([]),
    listSessions: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue({ theme: 'dark' }),
  },
}));

describe('Manoeuvre Studio App Shell', () => {
  it('renders navbar and brand title', () => {
    render(<App />);
    expect(screen.getByText('MANOEUVRE')).toBeInTheDocument();
    expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
  });

  it('renders all 9 primary navigation tabs', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveTextContent('Dashboard');
    expect(nav).toHaveTextContent('Device Manager');
    expect(nav).toHaveTextContent('Presentations');
    expect(nav).toHaveTextContent('Lecture Workspace');
    expect(nav).toHaveTextContent('AI Workspace');
    expect(nav).toHaveTextContent('Annotations');
    expect(nav).toHaveTextContent('Teaching Coach');
    expect(nav).toHaveTextContent('Analytics & History');
    expect(nav).toHaveTextContent('Settings');
  });

  it('navigates to Device Manager on tab click', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');
    const devBtn = Array.from(nav.querySelectorAll('button')).find((b) => b.textContent?.includes('Device Manager'));
    expect(devBtn).toBeDefined();
    fireEvent.click(devBtn!);
    expect(screen.getByText('Wearable Device Manager')).toBeInTheDocument();
    expect(screen.getByText('Physical Hardware Telemetry: 3-Button Test Bench')).toBeInTheDocument();
  });

  it('navigates to Settings on tab click', () => {
    render(<App />);
    const settingsTab = screen.getByText('Settings');
    fireEvent.click(settingsTab);
    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('AI Engine & Model Configuration')).toBeInTheDocument();
  });
});
