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
    setDeviceMode: vi.fn().mockResolvedValue({ status: 'ok' }),
  },
}));

describe('Manoeuvre Studio Modern UI', () => {
  it('renders Manoeuvre branding and professor welcome greeting', () => {
    render(<App />);
    expect(screen.getAllByText('Manoeuvre').length).toBeGreaterThan(0);
    expect(screen.getByText(/Welcome back Professor/i)).toBeInTheDocument();
  });

  it('renders all 8 primary Manoeuvre navigation tabs in sidebar', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Main menu' });
    expect(nav).toHaveTextContent('Dashboard');
    expect(nav).toHaveTextContent('Device Manager');
    expect(nav).toHaveTextContent('Presentations');
    expect(nav).toHaveTextContent('Lecture Workspace');
    expect(nav).toHaveTextContent('AI Workspace');
    expect(nav).toHaveTextContent('Annotations');
    expect(nav).toHaveTextContent('Teaching Coach');
    expect(nav).toHaveTextContent('Settings');
  });

  it('renders Wearable Glove, Presentation, and AI Copilot status cards', () => {
    render(<App />);
    expect(screen.getByText('Wearable Glove')).toBeInTheDocument();
    expect(screen.getByText('AI Teaching Copilot')).toBeInTheDocument();
    expect(screen.getByText(/Live Presentation|Active Lecture/i)).toBeInTheDocument();
  });

  it('renders Gesture & IMU Activity, Slide Agenda, and Slide Navigator', () => {
    render(<App />);
    expect(screen.getByText('Gesture & IMU Activity')).toBeInTheDocument();
    expect(screen.getByText(/transition smoothness/i)).toBeInTheDocument();
    expect(screen.getByText('Slide Deck Agenda')).toBeInTheDocument();
    expect(screen.getByText('Hardware & System Architecture')).toBeInTheDocument();
  });

  it('renders Active Lectures and Slide Annotations', () => {
    render(<App />);
    expect(screen.getByText('Active & Recent Lectures')).toBeInTheDocument();
    expect(screen.getByText('Slide Annotations & AI Recaps')).toBeInTheDocument();
    expect(screen.getByText('IMU Gyro Drift Vector Stroke')).toBeInTheDocument();
  });

  it('navigates to Device Manager on tab click', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Main menu' });
    const devBtn = Array.from(nav.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Device Manager')
    );
    expect(devBtn).toBeDefined();
    fireEvent.click(devBtn!);
    expect(screen.getByText('Wearable Glove Connection & Hardware Bench')).toBeInTheDocument();
  });

  it('navigates to Settings on tab click', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Main menu' });
    const settingsBtn = Array.from(nav.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Settings')
    );
    expect(settingsBtn).toBeDefined();
    fireEvent.click(settingsBtn!);
    expect(screen.getByText('System & Hardware Settings')).toBeInTheDocument();
  });
});
