import React from 'react';
import { MemoryProvider, useMemory } from './contexts/MemoryContext';
import { ViewState } from './types';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Planner } from './pages/Planner';
import { Resources } from './pages/Resources';
import { Scriba } from './pages/Scriba';
import { Timer } from './pages/Timer';
import { Notes } from './pages/Notes';

const AppContent: React.FC = () => {
  const { view } = useMemory();

  const renderPage = () => {
    switch (view) {
      case ViewState.LANDING: return <Landing />;
      case ViewState.AUTH: return <Auth />;
      case ViewState.ONBOARDING: return <Onboarding />;
      case ViewState.DASHBOARD: return <Dashboard />;
      case ViewState.PLANNER: return <Planner />;
      case ViewState.RESOURCES: return <Resources />;
      case ViewState.SCRIBA: return <Scriba />;
      case ViewState.TIMER: return <Timer />;
      case ViewState.NOTES: return <Notes />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <MemoryProvider>
      <AppContent />
    </MemoryProvider>
  );
};

export default App;