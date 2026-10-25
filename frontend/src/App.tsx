import React, { useState, useEffect } from 'react';
import { ManoeuvreSidebar, ManoeuvreTab } from './components/ManoeuvreSidebar';
import { ManoeuvreDashboardView } from './components/ManoeuvreDashboardView';
import { ManoeuvreHardwareModal } from './components/ManoeuvreHardwareModal';
import { DeviceManagerScreen } from './screens/DeviceManagerScreen';
import { PresentationManagerScreen } from './screens/PresentationManagerScreen';
import { LectureWorkspaceScreen } from './screens/LectureWorkspaceScreen';
import { AIWorkspaceScreen } from './screens/AIWorkspaceScreen';
import { AnnotationManagerScreen } from './screens/AnnotationManagerScreen';
import { TeachingCoachScreen } from './screens/TeachingCoachScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { wsService } from './services/websocket';
import { api } from './services/api';
import { PrimaryMode, PresentationState, ButtonEvent } from './types';

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ManoeuvreTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Hardware & Presentation State
  const [isDeviceConnected, setIsDeviceConnected] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<PrimaryMode>('CURSOR');
  const [lastButtonEvent, setLastButtonEvent] = useState<ButtonEvent | null>(null);
  const [presentation, setPresentation] = useState<PresentationState | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [hardwareModalOpen, setHardwareModalOpen] = useState<boolean>(false);
  const [aiInitialAction, setAiInitialAction] = useState<string>('explain');

  useEffect(() => {
    // 1. Connect WebSocket to local FastAPI backend
    wsService.connect();

    // 2. Initial state sync
    syncInitialState();

    // 3. Listen to incoming WebSocket events from backend / device
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
      console.warn('Initial sync warning (offline / simulation mode active):', err);
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

  const handleSetMode = async (mode: PrimaryMode) => {
    setActiveMode(mode);
    try {
      await api.setDeviceMode(mode);
    } catch (err) {
      console.warn('Set device mode warning:', err);
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
      await handleSetMode(next);
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

  const handleSelectPresentation = async (presId?: string) => {
    if (presId) {
      try {
        const state = await api.selectPresentation(presId);
        setPresentation(state);
      } catch (err) {
        console.warn('Select presentation warning:', err);
        await syncInitialState();
      }
    } else {
      await syncInitialState();
    }
  };

  const handleSelectSlide = async (slideIdx: number) => {
    try {
      const state = await api.gotoSlide(slideIdx);
      setPresentation(state);
    } catch (err) {
      console.warn('gotoSlide warning:', err);
    }
    setActiveTab('workspace');
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans bg-[#f8f9fb]">
      {/* Left Dark Sidebar with Glowing Lime Active Tab */}
      <ManoeuvreSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isDeviceConnected={isDeviceConnected}
        activeMode={activeMode}
        onOpenHardwareModal={() => setHardwareModalOpen(true)}
        sessionActive={activeSession !== null}
      />

      {/* Main Full-Screen Content Area */}
      <main
        className="flex-1 h-screen overflow-y-auto bg-[#f8f9fb] p-4 sm:p-5 lg:p-6 flex flex-col justify-between"
        role="region"
        aria-label="Manoeuvre Main Workspace"
      >
        {activeTab === 'dashboard' && (
          <ManoeuvreDashboardView
            professorName="Professor"
            isDeviceConnected={isDeviceConnected}
            activeMode={activeMode}
            presentation={presentation}
            sessionActive={activeSession !== null}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onStartSession={handleStartSession}
            onNavigate={setActiveTab}
            onSelectSlide={handleSelectSlide}
          />
        )}

        {activeTab === 'device' && (
          <DeviceManagerScreen
            isDeviceConnected={isDeviceConnected}
            activeMode={activeMode}
            lastButtonEvent={lastButtonEvent}
            onSimulateButton={handleSimulateButton}
            onSimulateNav={handleSimulateNav}
          />
        )}

        {activeTab === 'presentation' && (
          <PresentationManagerScreen
            onSelectPresentation={handleSelectPresentation}
            currentPresentation={presentation}
            onNavigateToWorkspace={() => setActiveTab('workspace')}
          />
        )}

        {activeTab === 'workspace' && (
          <div className="bg-slate-950 rounded-2xl overflow-hidden p-2 min-h-[640px] shadow-lg flex-1">
            <LectureWorkspaceScreen
              presentation={presentation}
              activeMode={activeMode}
              sessionActive={activeSession !== null}
              onNavigateAiWithSlide={(action) => {
                setAiInitialAction(action);
                setActiveTab('ai');
              }}
              onSlideChange={syncInitialState}
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <AIWorkspaceScreen
            presentation={presentation}
            initialAction={aiInitialAction}
          />
        )}

        {activeTab === 'annotations' && (
          <AnnotationManagerScreen presentation={presentation} />
        )}

        {activeTab === 'coach' && <TeachingCoachScreen />}

        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      {/* Hardware Companion Modal */}
      <ManoeuvreHardwareModal
        isOpen={hardwareModalOpen}
        onClose={() => setHardwareModalOpen(false)}
        isDeviceConnected={isDeviceConnected}
        activeMode={activeMode}
        onSetMode={handleSetMode}
        onNavigateToDeviceManager={() => {
          setHardwareModalOpen(false);
          setActiveTab('device');
        }}
        onNavigateToWorkspace={() => {
          setHardwareModalOpen(false);
          setActiveTab('workspace');
        }}
      />
    </div>
  );
};
