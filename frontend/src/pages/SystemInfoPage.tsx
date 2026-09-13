import React from 'react';
import { 
  Server, Database, Network, ShieldCheck, Cpu, 
  Terminal, Layers, AlertTriangle, CheckCircle, Calculator, GitBranch 
} from 'lucide-react';

export const SystemInfoPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* SIH Problem Statement Card */}
      <div className="p-6 rounded-xl border border-blue-900/40 bg-slate-900/60 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-mono bg-blue-900/80 text-blue-300 rounded border border-blue-700">
                SIH26028
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase">Smart India Hackathon 2026</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains
            </h1>
            <p className="text-xs text-blue-400 font-medium">Organization: Ministry of Railways • Theme: Smart Automation</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold rounded-full flex items-center">
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Software Prototype
            </span>
          </div>
        </div>

        {/* Honesty & Ethics Statement */}
        <div className="mt-4 p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-200/90 leading-relaxed">
          <div className="flex items-center space-x-2 text-amber-400 font-bold mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>SIH 2026 RESEARCH & PROTOTYPE DISCLAIMER</span>
          </div>
          This application is a research and hackathon demonstration prototype. In strict adherence to SIH integrity requirements, it is clearly noted that this software operates in <b>DEMO / SIMULATION MODE</b> using high-fidelity synthetic and public-data-inspired Indian Railways network physics. It does <b>NOT</b> claim unauthorized access to official Indian Railways internal live GPS feeds, FOIS (Freight Operations Information System), COIS (Coaching Operations Information System), or private CRIS databases.
        </div>
      </div>

      {/* Ensemble Variance & Uncertainty Methodology (Requirement 13) */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Prediction Confidence & Uncertainty Estimation Methodology
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Defensible uncertainty calibration derived from the Random Forest decision tree ensemble variance
          </p>
        </div>

        <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-3 leading-relaxed text-slate-300">
          <p>
            Rather than asserting an arbitrary or medically certified probability, this platform calculates <b>Prediction Confidence</b> based on the empirical disagreement (variance) across the 100 individual decision tree estimators within the trained <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">RandomForestRegressor</code>:
          </p>
          <div className="p-3 bg-slate-900 rounded-md font-mono text-[11px] text-blue-300 border border-slate-800">
            <div>\hat&#123;\mu&#125; = \frac&#123;1&#125;&#123;N&#125; \sum_&#123;i=1&#125;^&#123;N&#125; T_i(X) \quad \text&#123;(Ensemble Mean Prediction)&#125;</div>
            <div className="mt-1">\sigma_&#123;ensemble&#125; = \sqrt&#123;\frac&#123;1&#125;&#123;N&#125; \sum_&#123;i=1&#125;^&#123;N&#125; (T_i(X) - \hat&#123;\mu&#125;)^2&#125; \quad \text&#123;(Tree Spread / Disagreement)&#125;</div>
            <div className="mt-1">\text&#123;Confidence Score&#125; = \text&#123;clip&#125;\left(1.0 - \frac&#123;\sigma_&#123;ensemble&#125;&#125;&#123;15.0&#125;, 0.55, 0.97\right) \times \delta_&#123;horizon&#125;</div>
          </div>
          <p>
            <b>Operational Interpretation:</b> When track conditions are clear and nominal, all trees arrive at uniform traversal rates ($\sigma \approx 0.8$ min), yielding high confidence (~95%). During severe perturbations (e.g. caution orders or torrential monsoon downpours), divergent branch splits produce wider tree variance, causing the confidence gauge to naturally decrease and signaling higher operational volatility to section controllers.
          </p>
        </div>
      </div>

      {/* Production Scalability Architecture Blueprint */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <div className="mb-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Target Production Scalability Architecture (10,000+ Trains)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            How this prototype transitions from SQLite to an enterprise high-throughput railway telemetry engine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* PostgreSQL & PostGIS */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2">
            <div className="flex items-center space-x-2 text-blue-400 font-semibold">
              <Database className="w-4 h-4" />
              <h3 className="text-sm">PostgreSQL + PostGIS</h3>
            </div>
            <p className="text-slate-400">
              Drop-in replacement for the current SQLAlchemy SQLite layer. PostGIS provides native spatial queries for track centerline geofencing, block clearance, and junction topological queries.
            </p>
            <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
              `DATABASE_URL=postgresql://user:pass@host/ir_eta`
            </div>
          </div>

          {/* Redis & Kafka */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
              <Network className="w-4 h-4" />
              <h3 className="text-sm">Redis Pub/Sub & Apache Kafka</h3>
            </div>
            <p className="text-slate-400">
              High-throughput message broker ingestion layer handling 50,000+ GPS location packets/sec from locomotive RTIS (Real-time Train Information System) devices.
            </p>
            <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
              `TOPIC: ir.telemetry.gps.v1`
            </div>
          </div>

          {/* Celery / Background Workers */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2">
            <div className="flex items-center space-x-2 text-purple-400 font-semibold">
              <Server className="w-4 h-4" />
              <h3 className="text-sm">Celery / Ray Distributed Workers</h3>
            </div>
            <p className="text-slate-400">
              Decoupled asynchronous worker pool computing downstream cascading ETAs whenever an event triggers, preventing API thread exhaustion.
            </p>
            <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
              Parallel inference per division
            </div>
          </div>

          {/* Model Serving Microservice */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <Cpu className="w-4 h-4" />
              <h3 className="text-sm">Triton / ONNX Model Serving</h3>
            </div>
            <p className="text-slate-400">
              Exporting trained models to ONNX runtime with sub-millisecond inference per train-section, supporting LightGBM, XGBoost, and Graph Neural Networks (GNNs) for network-wide delay ripple propagation.
            </p>
            <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
              ONNX runtime latency: &lt; 0.8ms
            </div>
          </div>

          {/* WebSocket / Push Gateway */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <Terminal className="w-4 h-4" />
              <h3 className="text-sm">WebSocket Streaming Gateway</h3>
            </div>
            <p className="text-slate-400">
              Real-time push gateway disseminating updated ETAs to station display boards, National Train Enquiry System (NTES), crew schedulers, and passenger apps without client polling.
            </p>
            <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
              WebSocket `/ws/telemetry`
            </div>
          </div>

          {/* Edge / K8s Horizontal Scaling */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="text-sm">Kubernetes Horizontal Auto-Scaler</h3>
            </div>
            <p className="text-slate-400">
              Stateless FastAPI containers auto-scaling based on CPU/memory load across regional zones (Northern, Western, Southern, Eastern railways).
            </p>
            <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
              Zonal partitioned microservices
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
