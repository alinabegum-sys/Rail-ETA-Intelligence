# RailETA Intelligence Platform

### Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains
**Smart India Hackathon 2026 — Problem Statement ID: SIH26028**  
**Organization:** Ministry of Railways | **Category:** Software | **Theme:** Smart Automation  
**Live Production URL:** [https://rail-eta-intelligence.vercel.app](https://rail-eta-intelligence.vercel.app)

---

## 1. Project Overview
The **RailETA Intelligence Platform** is an end-to-end, production-style intelligent dispatch and passenger advisory platform engineered for Smart India Hackathon 2026 Problem Statement **SIH26028** under the Ministry of Railways.

Traditional railway arrival estimation heavily relies on static timetable schedules or naive delay extrapolation ($ETA = Scheduled + Current Delay$). This conventional method fails to account for physical section constraints, temporary caution speed restrictions (TSR), compounding congestion in automatic signaling blocks, junction dwell overruns, weather disruptions, or engineered schedule recovery slack.

RailETA solves this by providing a dynamic, machine-learning-driven ETA forecast engine that iteratively traverses route sections, calculating expected traversal deviations and propagating cascading delays downstream in real time.

---

## 2. SIH26028 Problem Statement Details
- **Problem Statement ID:** SIH26028
- **Title:** Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains
- **Organization:** Ministry of Railways
- **Category:** Software
- **Theme:** Smart Automation
- **Target Users:** Railway Operations Control Rooms, Section Controllers, Station Masters, Platform Coordinators, and Rail Passengers.

---

## 3. The Operational Challenge
Operating one of the world's most congested rail networks involves multiple non-linear operating variables:
1. **Static Propagation Fallacy:** Traditional systems assume a delayed train continues with that same delay until destination, ignoring track line speed limits and clear-track recovery cushions.
2. **Temporary Speed Restrictions (TSR):** Caution orders (e.g. 30 km/h or 45 km/h for track maintenance or turnout renewal) severely perturb train acceleration and section run times.
3. **Headway Compounding:** Signal delays at junction throats cascade backward onto following trains sharing automatic signaling blocks.
4. **Built-in Recovery Slack:** Indian Railways timetables include 5–12% engineered schedule slack on trunk lines where delayed trains can make up lost time if tracks are clear; static systems miss this and over-predict terminus delays.
5. **Weather & Visibility:** Monsoon precipitation and winter fog trigger strict fog signaling and visibility regulations that degrade train velocity.

---

## 4. Key Features
- **Central Railway Operations Dashboard:** High-level fleet monitoring across 8 coaching trains on major trunk corridors with live delay status badges, velocity gauges, and journey progress bars.
- **Interactive Spatial GIS Map:** OpenStreetMap + Leaflet GIS visualization showing active train markers with live coordinates, delay pills, and route polylines.
- **Station-by-Station Timetable Forecast:** Stop-by-stop comparison of Scheduled Arrival vs Static Baseline Extrapolation vs Dynamic ML Prediction with individual confidence scores.
- **Transparent Prediction Explainability:** Real-time decomposition of delay drivers (momentum propagation, caution orders, corridor density, adverse weather, and recovery slack).
- **Disruption Simulation Cockpit:** Interactive real-time injection and resolution of operational events:
  - Caution Order / Speed Restriction (TSR)
  - Automatic Signaling Glitch
  - Heavy Corridor Track Congestion
  - Unscheduled Halt / Mechanical Check
  - Severe Monsoon / Fog Weather
  - Track Maintenance
  - Clear Track Schedule Recovery Slack
- **Holdout Test Set ML Analytics:** Side-by-side comparison of Baseline MAE (20.72m) vs ML Model MAE (2.46m) achieving an **88.2% error reduction** ($R^2 = 0.967$).
- **Dual Railway Clocks:** Independent `System Time · IST` (live ticking client clock) and `Simulation Time · IST` (simulation scenario clock starting near real IST).

---

## 5. System Architecture

### Vercel Serverless Cloud & Local Monorepo Architecture
```
rail-eta-intelligence/
├── api/                             <-- Vercel Serverless Function Layer
│   ├── index.js                     <-- Prebundled Zero-Cold-Start Serverless API
│   │                                    (All 13 endpoints: trains, simulation, analytics)
│   ├── package.json
│   └── data/
│       ├── rf_model_trees.json      <-- 100 Exported Decision Trees (<0.5ms inference)
│       ├── model_metrics.json       <-- Genuine Holdout Test Evaluation Metrics
│       └── railway_seed.json        <-- 8-Train Fleet & Station Network Data
├── frontend/                        <-- React 18 + Vite + Tailwind CSS + Leaflet
│   ├── src/
│   │   ├── components/              <-- Navbar, RouteMap, TrainTable, Gauges, Controls
│   │   ├── pages/                   <-- Dashboard, Live Trains, ETA, Sim Room, Analytics
│   │   └── services/api.ts          <-- Dual-Mode API Client (with session sync)
│   └── dist/                        <-- Static Production Bundle
├── backend/                         <-- Python 3.11 FastAPI Backend (for local run / pytest)
│   ├── app/
│   │   ├── api/                     <-- Trains, Simulation, and Analytics routers
│   │   ├── database/                <-- SQLAlchemy models, session, seed data
│   │   ├── ml/                      <-- Dataset generator, RF trainer, predictor, explainability
│   │   ├── schemas/                 <-- Pydantic v2 schemas
│   │   └── services/                <-- ETA service & Simulation engine
│   └── tests/                       <-- 9/9 Automated pytest test suite
├── vercel.json                      <-- Single Project Vercel Routing Configuration
├── package.json                     <-- Monorepo Build Scripts
└── .env.example                     <-- Environment Configuration Template
```

---

## 6. Machine Learning Methodology

### Problem Formulation
The machine learning pipeline formulates dynamic ETA forecasting as iterative inter-station section delay prediction:
$$\text{ETA}_{station_{k}} = \text{ScheduledArrival}_{k} + \text{AccumulatedDelay}_{k}$$
$$\text{AccumulatedDelay}_{k} = \text{CurrentDelay} + \sum_{i=1}^{k} \hat{\Delta}_{i}$$
where $\hat{\Delta}_{i}$ is the ML-predicted additional delay increment for section $i \to i+1$.

### Model Architecture
- **Algorithm:** `RandomForestRegressor` (100 estimators, max depth 14, min samples split 4, min samples leaf 2)
- **Baseline Benchmark:** Static timetable extrapolation ($\Delta = 0$, holding current delay constant)
- **Inference Optimization:** In addition to the Python model (`joblib`), the 100 decision trees were exported into a compact JSON ensemble (`rf_model_trees.json`). The serverless function evaluates the exact same decision tree structure node-by-node with **100% mathematical fidelity** in **<0.5 milliseconds** with zero Python bundle size overhead.

### Feature Vectors (16 Operational Features)
1. `current_delay`: Section entry delay (minutes)
2. `current_speed`: Instantaneous velocity (km/h)
3. `distance_to_next`: Section length (km)
4. `historical_section_time`: Scheduled nominal traversal time (minutes)
5. `historical_delay`: Historical section delay bias (minutes)
6. `dwell_time`: Scheduled + overrun junction dwell (minutes)
7. `remaining_stops`: Remaining journey horizon count
8. `time_of_day_hour`: Peak traffic hour (0–23)
9. `day_of_week`: Day of week (0–6)
10. `congestion_level`: Track occupancy fraction (0.0 to 1.0)
11. `event_severity`: Operational incident severity tier (0 to 4)
12. `speed_restriction`: Caution order limit (0, 30, 45, 75 km/h)
13. `weather_severity`: 0=Clear, 1=Fog, 2=Heavy Rain, 3=Severe Storm
14. `rainfall`: Precipitation rate (mm/hr)
15. `visibility`: Sighting distance (km)
16. `preceding_train_delay`: Headway deviation of train in front (minutes)

### Real Computed Evaluation Metrics (Holdout Test Set)
Evaluated on 2,400 holdout test samples:
- **Baseline MAE:** `20.72 minutes` (static extrapolation)
- **ML Model MAE:** `2.46 minutes` (dynamic forecast)
- **Error Reduction:** `88.2%` improvement over baseline
- **Baseline RMSE:** `27.56 minutes`
- **ML Model RMSE:** `3.40 minutes`
- **Model $R^2$ Score:** `0.967`

---

## 7. Technology Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Recharts, Lucide React
- **Cloud & Serverless:** Vercel Serverless Functions (Node.js 20 runtime), Edge CDN
- **Backend (Local):** Python 3.11, FastAPI, Pydantic v2, SQLAlchemy ORM, Uvicorn
- **Machine Learning:** Scikit-Learn (`RandomForestRegressor`), Pandas, NumPy, Joblib
- **Database:** SQLite (local zero-dependency development; PostgreSQL ready)
- **Mapping:** OpenStreetMap standard raster tiles via Leaflet (no external API keys required)

---

## 8. How to Run Locally

### Prerequisites
- Node.js 18+ (Node 20 recommended)
- Python 3.10+ (Python 3.11 recommended)

### Quick Start
```bash
# 1. Clone repository
git clone <repository-url>
cd rail-eta-intelligence

# 2. Install Frontend Dependencies
cd frontend && npm install && cd ..

# 3. (Optional) Run with Python Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
./run_backend.sh

# 4. In a separate terminal, launch Frontend
cd frontend && npm run dev
```
Open **http://localhost:5173** in your browser.

### Automated Test Suite
Run the 9 automated pytest tests:
```bash
PYTHONPATH=backend pytest backend/tests -v
```

---

## 9. Cloud Deployment (Vercel)
The project is configured for single-project Vercel deployment:
- **Root `vercel.json`:** Directs `/api/(.*)` to the serverless function layer and `/(.*)` to `frontend/dist/index.html`.
- **Live URL:** [https://rail-eta-intelligence.vercel.app](https://rail-eta-intelligence.vercel.app)

---

## 10. Future Scalability Blueprint (10,000+ Trains)
- **Streaming Telemetry:** Apache Kafka cluster ingesting Real-time Train Information System (RTIS) locomotive GPS pings.
- **Distributed Inference:** Triton Inference Server with ONNX runtime achieving <0.2ms per-train inference.
- **Spatial Indexing:** PostgreSQL + PostGIS for spatial corridor lookups and block occupancy tracking.
- **Zonal Microservices:** Kubernetes auto-scaling across railway zones (Northern, Western, Southern, Central).

---

## 11. Ethical & Prototype Disclaimer
> [!IMPORTANT]
> **SIH 2026 Research & Prototype Notice:**  
> This software is an independent research prototype developed for Smart India Hackathon 2026 (Problem Statement SIH26028). It uses realistic synthetic, public-domain-inspired Indian Railways timetables, trunk network station coordinates, and simulated operational disruption events.  
> It does **NOT** claim direct or authorized integration with proprietary Indian Railways operational databases such as COIS, FOIS, ICMS, or internal CRIS server infrastructures.
