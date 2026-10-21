import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardScreen } from './screens/DashboardScreen';
import { DeviceManagerScreen } from './screens/DeviceManagerScreen';
import { PresentationManagerScreen } from './screens/PresentationManagerScreen';
import { LectureWorkspaceScreen } from './screens/LectureWorkspaceScreen';
import { AIWorkspaceScreen } from './screens/AIWorkspaceScreen';
import { AnnotationManagerScreen } from './screens/AnnotationManagerScreen';
import { TeachingCoachScreen } from './screens/TeachingCoachScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { wsService } from './services/websocket';
import { api } from './services/api';
import { PrimaryMode, PresentationState, ButtonEvent } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isDeviceConnected, setIsDeviceConnected] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<PrimaryMode>('CURSOR');
  const [lastButtonEvent, setLastButtonEvent] = useState<ButtonEvent | null>(null);
  const [presentation, setPresentation] = useState<PresentationState | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [aiInitialAction, setAiInitialAction] = useState<string>('explain');

  useEffect(() => {
    // 1. Connect WebSocket
    wsService.connect();

    // 2. Initial state sync
    syncInitialState();

    // 3. Listen to incoming WebSocket events from backend
    const unsubscribe = wsService.subscribe((msg: any) => {
      const type = msg.type;
      const payload = msg.payload;

      if (type === 'device_connected') {
        setIsDeviceConnected(true);
      } else if (type === 'device_disconnected') {
        setIsDeviceConnected(false);
      } else if (type === 'button_event') {
        setLastButtonEvent(payload);
        if (payload?.mode) {
          setActiveMode(payload.mode as PrimaryMode);
        }
      } else if (type === 'mode_changed') {
        if (payload?.new_mode) {
          setActiveMode(payload.new_mode as PrimaryMode);
        }
      } else if (type === 'presentation_state' || type === 'presentation_loaded') {
        setPresentation(payload);
      } else if (type === 'session_started') {
        setActiveSession(payload);
      } else if (type === 'session_ended') {
        setActiveSession(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const syncInitialState = async () => {
    try {
      const dev = await api.getDeviceStatus();
      setIsDeviceConnected(dev?.connected || false);

      const pres = await api.getPresentationState();
      setPresentation(pres);

      const sess = await api.getActiveSession();
      if (sess?.active) {
        setActiveSession(sess.session);
      }
    } catch (err) {
      console.warn('Initial sync warning:', err);
    }
  };

  const handleStartSession = async (title: string) => {
    try {
      const presId = presentation?.presentation_id || undefined;
      const newSess = await api.startSession(title, presId);
      setActiveSession(newSess);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleSimulateButton = async (button: 'MODE' | 'ACTION' | 'SYSTEM', action: string) => {
    setLastButtonEvent({
      button,
      action: action as any,
      mode: activeMode,
      state: 'RELEASED',
      duration_ms: 120,
    });

    if (button === 'MODE') {
      const modes: PrimaryMode[] = ['CURSOR', 'ANNOTATE', 'HIGHLIGHT', 'VOICE'];
      const idx = (modes.indexOf(activeMode) + 1) % modes.length;
      const next = modes[idx];
      setActiveMode(next);
      await api.setDeviceMode(next);
    } else if (button === 'ACTION') {
      // Toggle
    }
  };

  const handleSimulateNav = async (direction: 'NEXT' | 'PREVIOUS') => {
    if (direction === 'NEXT') {
      const state = await api.nextSlide();
      setPresentation(state);
    } else {
      const state = await api.prevSlide();
      setPresentation(state);
    }
  };

  const handleNavigateAiWithSlide = (action: string) => {
    setAiInitialAction(action);
    setCurrentTab('ai');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isDeviceConnected={isDeviceConnected}
        activeMode={activeMode}
        sessionActive={activeSession !== null}
        sessionTitle={activeSession?.title}
      />

      {/* Main Tab Screen Area */}
      <main className="flex-1 overflow-hidden relative">
        {currentTab === 'dashboard' && (
          <DashboardScreen
            onNavigate={setCurrentTab}
            isDeviceConnected={isDeviceConnected}
            activeMode={activeMode}
            onStartSession={handleStartSession}
            sessionActive={activeSession !== null}
          />
        )}

        {currentTab === 'device' && (
          <DeviceManagerScreen
            isDeviceConnected={isDeviceConnected}
            activeMode={activeMode}
            lastButtonEvent={lastButtonEvent}
            onSimulateButton={handleSimulateButton}
            onSimulateNav={handleSimulateNav}
          />
        )}

        {currentTab === 'presentation' && (
          <PresentationManagerScreen
            onSelectPresentation={() => syncInitialState()}
            currentPresentation={presentation}
            onNavigateToWorkspace={() => setCurrentTab('workspace')}
          />
        )}

        {currentTab === 'workspace' && (
          <LectureWorkspaceScreen
            presentation={presentation}
            activeMode={activeMode}
            sessionActive={activeSession !== null}
            onNavigateAiWithSlide={handleNavigateAiWithSlide}
            onSlideChange={syncInitialState}
          />
        )}

        {currentTab === 'ai' && (
          <AIWorkspaceScreen
            presentation={presentation}
            initialAction={aiInitialAction}
          />
        )}

        {currentTab === 'annotations' && (
          <AnnotationManagerScreen presentation={presentation} />
        )}

        {currentTab === 'coach' && <TeachingCoachScreen />}

        {currentTab === 'analytics' && <AnalyticsScreen />}

        {currentTab === 'settings' && <SettingsScreen />}
      </main>
    </div>
  );
};
