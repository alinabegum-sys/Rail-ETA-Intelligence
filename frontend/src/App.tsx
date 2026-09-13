import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { TrainDetailsPage } from './pages/TrainDetailsPage';
import { ETAForecastPage } from './pages/ETAForecastPage';
import { SimulationPage } from './pages/SimulationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SystemInfoPage } from './pages/SystemInfoPage';
import { TrainTable } from './components/TrainTable';
import { 
  TrainSummary, TrainStop, TrainETAForecast, 
  SimulationState, ModelMetrics, OperationalEvent, EventHistoryItem 
} from './types';
import { api } from './services/api';
import { Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [trains, setTrains] = useState<TrainSummary[]>([]);
  const [selectedTrainId, setSelectedTrainId] = useState<string>('TRN_12951');
  const [stops, setStops] = useState<TrainStop[]>([]);
  const [forecast, setForecast] = useState<TrainETAForecast | null>(null);
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [activeEvents, setActiveEvents] = useState<OperationalEvent[]>([]);
  const [eventHistory, setEventHistory] = useState<EventHistoryItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const selectedTrainIdRef = useRef(selectedTrainId);
  selectedTrainIdRef.current = selectedTrainId;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // Load initial static model metrics
  useEffect(() => {
    api.getModelMetrics()
      .then(m => {
        setMetrics(m);
        setApiError(null);
      })
      .catch(err => {
        console.error("Error fetching model metrics:", err);
        setApiError("Backend service initializing or unavailable. Reconnecting...");
      });
  }, []);

  // Fetch trains & simulation state
  const refreshTelemetry = useCallback(async () => {
    try {
      const [trainList, sim] = await Promise.all([
        api.getTrains(),
        api.getSimulationState()
      ]);
      setTrains(trainList);
      setSimState(sim);
      setApiError(null);

      // Extract active events from trains
      const allEvents: OperationalEvent[] = [];
      trainList.forEach(t => {
        if (t.has_active_event) {
          allEvents.push({
            event_id: `EVT_${t.train_id}`,
            train_id: t.train_id,
            event_type: t.event_type || 'Caution Order',
            severity: 'Moderate',
            duration_minutes: 20,
            location: t.next_station,
            timestamp: new Date().toISOString(),
            is_active: true
          });
        }
      });
      setActiveEvents(allEvents);

      if (!selectedTrainIdRef.current && trainList.length > 0) {
        setSelectedTrainId(trainList[0].train_id);
      }
    } catch (err) {
      console.error("Error refreshing telemetry:", err);
      setApiError("Unable to reach backend ETA forecasting service. Please verify backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch train-specific route stops and dynamic ETA forecast
  const fetchTrainData = useCallback(async (trainId: string) => {
    if (!trainId) return;
    try {
      const [routeStops, etaForecast] = await Promise.all([
        api.getTrainRoute(trainId),
        api.getTrainETA(trainId)
      ]);
      setStops(routeStops);
      setForecast(etaForecast);
    } catch (err) {
      console.error(`Error loading data for train ${trainId}:`, err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshTelemetry();
  }, [refreshTelemetry]);

  // Load train data when selected train changes
  useEffect(() => {
    if (selectedTrainId) {
      fetchTrainData(selectedTrainId);
    }
  }, [selectedTrainId, fetchTrainData]);

  // Controlled background polling for live real-time simulation updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTelemetry();
      if (selectedTrainIdRef.current) {
        fetchTrainData(selectedTrainIdRef.current);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshTelemetry, fetchTrainData]);

  // Simulation controls
  const handleStartSimulation = async () => {
    await api.startSimulation();
    await refreshTelemetry();
    showNotification("Simulation continuous auto-engine started.");
  };

  const handlePauseSimulation = async () => {
    await api.pauseSimulation();
    await refreshTelemetry();
    showNotification("Simulation engine paused.");
  };

  const handleStepSimulation = async (minutes: number) => {
    await api.stepSimulation(minutes);
    await refreshTelemetry();
    if (selectedTrainId) {
      await fetchTrainData(selectedTrainId);
    }
    showNotification(`Simulation advanced by +${minutes} minutes. Train positions & ETAs updated.`);
  };

  const handleResetSimulation = async () => {
    await api.resetSimulation();
    await refreshTelemetry();
    if (selectedTrainId) {
      await fetchTrainData(selectedTrainId);
    }
    setEventHistory([]);
    showNotification("Simulation environment reset to initial baseline demo state.");
  };

  const handleInjectEvent = async (eventData: any) => {
    try {
      const targetTrain = trains.find(t => t.train_id === eventData.train_id);
      const beforeDelay = targetTrain ? targetTrain.current_delay_minutes : 0;

      const ev = await api.injectEvent(eventData);
      await refreshTelemetry();
      if (selectedTrainId) {
        await fetchTrainData(selectedTrainId);
      }

      // Record to local session event history
      const delayDelta = eventData.severity === 'Critical' ? 22 : eventData.severity === 'Major' ? 15 : 8;
      const newHistoryItem: EventHistoryItem = {
        id: ev.event_id,
        train_number: targetTrain ? targetTrain.train_number : eventData.train_id,
        event_type: eventData.event_type,
        severity: eventData.severity,
        location: eventData.location,
        before_delay: beforeDelay,
        after_delay: beforeDelay + delayDelta,
        timestamp: new Date().toLocaleTimeString(),
        is_active: true
      };
      setEventHistory(prev => [newHistoryItem, ...prev]);

      showNotification(`⚠️ Disruption "${eventData.event_type}" injected on Train #${newHistoryItem.train_number}. Delay increased (+${delayDelta}m) and downstream ETAs recalculated!`);
    } catch (err) {
      console.error("Failed to inject event:", err);
      showNotification("Failed to inject event. Check server logs.");
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    try {
      await api.resolveEvent(eventId);
      await refreshTelemetry();
      if (selectedTrainId) {
        await fetchTrainData(selectedTrainId);
      }
      setEventHistory(prev => prev.map(item => item.id === eventId ? { ...item, is_active: false } : item));
      showNotification(`Disruption resolved. Track caution cleared; train resuming speed recovery.`);
    } catch (err) {
      console.error("Failed to resolve event:", err);
    }
  };

  const selectedTrain = trains.find(t => t.train_id === selectedTrainId) || trains[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a] text-slate-100 selection:bg-blue-600">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        trains={trains}
        selectedTrainId={selectedTrainId}
        setSelectedTrainId={setSelectedTrainId}
        simulatedTime={simState?.simulated_time || '16:30:00 (IST)'}
        isRunning={simState?.is_running || false}
        onRefresh={() => {
          refreshTelemetry();
          if (selectedTrainId) fetchTrainData(selectedTrainId);
        }}
      />

      {/* Backend API Error Banner */}
      {apiError && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{apiError}</span>
          </div>
          <button 
            onClick={() => refreshTelemetry()}
            className="px-2.5 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-white font-medium text-[11px]"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-blue-500/60 shadow-2xl rounded-xl p-3.5 flex items-start space-x-3 text-xs text-slate-200 animate-bounce">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="p-20 text-center text-slate-400">
            <Activity className="w-8 h-8 mx-auto animate-spin text-blue-500 mb-3" />
            <p className="font-medium text-sm">Connecting to RailETA Intelligence Service...</p>
            <p className="text-xs text-slate-500 mt-1">Initializing SQLite ORM & Loading ML Predictor</p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardPage
                trains={trains}
                selectedTrainId={selectedTrainId}
                onSelectTrain={setSelectedTrainId}
                onViewDetails={(id) => {
                  setSelectedTrainId(id);
                  setCurrentTab('details');
                }}
                stops={stops}
                metrics={metrics}
              />
            )}

            {currentTab === 'trains' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Active Trains Fleet Overview</h1>
                    <p className="text-xs text-slate-400">Complete corridor fleet monitoring with current delay momentum</p>
                  </div>
                </div>
                <TrainTable
                  trains={trains}
                  selectedTrainId={selectedTrainId}
                  onSelectTrain={setSelectedTrainId}
                  onViewDetails={(id) => {
                    setSelectedTrainId(id);
                    setCurrentTab('details');
                  }}
                />
              </div>
            )}

            {currentTab === 'details' && (
              <TrainDetailsPage
                train={selectedTrain}
                forecast={forecast}
                stops={stops}
                onNavigateToForecast={() => setCurrentTab('forecast')}
                onNavigateToSimulation={() => setCurrentTab('simulation')}
              />
            )}

            {currentTab === 'forecast' && (
              <ETAForecastPage
                train={selectedTrain}
                forecast={forecast}
                trains={trains}
                selectedTrainId={selectedTrainId}
                onSelectTrain={setSelectedTrainId}
              />
            )}

            {currentTab === 'simulation' && (
              <SimulationPage
                isRunning={simState?.is_running || false}
                onStart={handleStartSimulation}
                onPause={handlePauseSimulation}
                onStep={handleStepSimulation}
                onReset={handleResetSimulation}
                trains={trains}
                selectedTrainId={selectedTrainId}
                onSelectTrain={setSelectedTrainId}
                onInjectEvent={handleInjectEvent}
                onResolveEvent={handleResolveEvent}
                activeEvents={activeEvents}
                eventHistory={eventHistory}
                forecast={forecast}
                stops={stops}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsPage />
            )}

            {currentTab === 'system' && (
              <SystemInfoPage />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#060a14] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart India Hackathon 2026 • Problem Statement SIH26028 (Ministry of Railways)</span>
          <span className="text-[11px] text-slate-400">
            Powered by FastAPI, Scikit-learn, React 18 & OpenStreetMap
          </span>
        </div>
      </footer>
    </div>
  );
};
