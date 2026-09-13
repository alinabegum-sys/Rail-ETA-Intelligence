import { 
  TrainSummary, TrainStop, TrainETAForecast, SimulationState, 
  ModelMetrics, PerformanceAnalytics, OperationalEvent 
} from '../types';

const API_BASE = '/api';
const SIM_STATE_KEY = 'rail_eta_sim_state';

async function fetchWithSession(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  
  // Attach cached simulation session state if present
  const storedState = sessionStorage.getItem(SIM_STATE_KEY);
  if (storedState && !headers.has('x-sim-state')) {
    headers.set('x-sim-state', storedState);
  }

  const res = await fetch(url, { ...options, headers });

  // Update session state from response header if returned by serverless engine
  const responseSimState = res.headers.get('x-sim-state');
  if (responseSimState) {
    try {
      sessionStorage.setItem(SIM_STATE_KEY, responseSimState);
    } catch {
      // Ignore quota/private browsing errors
    }
  }

  return res;
}

export const api = {
  async getTrains(): Promise<TrainSummary[]> {
    const res = await fetchWithSession(`${API_BASE}/trains`);
    if (!res.ok) throw new Error('Failed to fetch trains');
    return res.json();
  },

  async getTrainDetail(trainId: string): Promise<any> {
    const res = await fetchWithSession(`${API_BASE}/trains/${trainId}`);
    if (!res.ok) throw new Error(`Failed to fetch train ${trainId}`);
    return res.json();
  },

  async getTrainRoute(trainId: string): Promise<TrainStop[]> {
    const res = await fetchWithSession(`${API_BASE}/trains/${trainId}/route`);
    if (!res.ok) throw new Error(`Failed to fetch route for train ${trainId}`);
    return res.json();
  },

  async getTrainETA(trainId: string): Promise<TrainETAForecast> {
    const res = await fetchWithSession(`${API_BASE}/trains/${trainId}/eta`);
    if (!res.ok) throw new Error(`Failed to fetch ETA forecast for train ${trainId}`);
    return res.json();
  },

  async getSimulationState(): Promise<SimulationState> {
    const res = await fetchWithSession(`${API_BASE}/simulation/state`);
    if (!res.ok) throw new Error('Failed to fetch simulation state');
    return res.json();
  },

  async startSimulation(): Promise<any> {
    const res = await fetchWithSession(`${API_BASE}/simulation/start`, { method: 'POST' });
    return res.json();
  },

  async pauseSimulation(): Promise<any> {
    const res = await fetchWithSession(`${API_BASE}/simulation/pause`, { method: 'POST' });
    return res.json();
  },

  async stepSimulation(minutes: number = 15): Promise<SimulationState> {
    const res = await fetchWithSession(`${API_BASE}/simulation/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes_to_advance: minutes })
    });
    if (!res.ok) throw new Error('Failed to advance simulation step');
    return res.json();
  },

  async resetSimulation(): Promise<SimulationState> {
    sessionStorage.removeItem(SIM_STATE_KEY);
    const res = await fetchWithSession(`${API_BASE}/simulation/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset simulation');
    return res.json();
  },

  async injectEvent(event: {
    train_id: string;
    event_type: string;
    severity: string;
    duration_minutes: number;
    location: string;
    description: string;
  }): Promise<OperationalEvent> {
    const res = await fetchWithSession(`${API_BASE}/simulation/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (!res.ok) throw new Error('Failed to inject disruption event');
    return res.json();
  },

  async resolveEvent(eventId: string): Promise<any> {
    const res = await fetchWithSession(`${API_BASE}/simulation/event/${eventId}/resolve`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`Failed to resolve event ${eventId}`);
    return res.json();
  },

  async getModelMetrics(): Promise<ModelMetrics> {
    const res = await fetchWithSession(`${API_BASE}/analytics/model`);
    if (!res.ok) throw new Error('Failed to fetch model metrics');
    return res.json();
  },

  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    const res = await fetchWithSession(`${API_BASE}/analytics/performance`);
    if (!res.ok) throw new Error('Failed to fetch performance analytics');
    return res.json();
  }
};
