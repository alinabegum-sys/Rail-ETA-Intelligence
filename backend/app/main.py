import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import engine, Base, SessionLocal
from app.database.seed_data import seed_database
from app.ml.predictor import predictor
from app.services.simulation_engine import simulation_engine
from app.api import trains, simulation, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed data exist
    seed_database()
    # Initialize ML predictor
    _ = predictor
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains (SIH26028 - Ministry of Railways)",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections
connected_clients: list[WebSocket] = []

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        # Send initial state
        db = SessionLocal()
        state = simulation_engine.get_state(db)
        db.close()
        await websocket.send_json({"type": "simulation_state", "data": state})
        
        while True:
            # Handle incoming client messages (e.g. heartbeat or step triggers)
            data = await websocket.receive_text()
            if data == "get_state":
                db = SessionLocal()
                st = simulation_engine.get_state(db)
                db.close()
                await websocket.send_json({"type": "simulation_state", "data": st})
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)

# Include API Routers
app.include_router(trains.router, prefix=settings.API_PREFIX)
app.include_router(simulation.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)

@app.get("/")
def read_root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "DEMO / SIMULATION MODE (Realistic Synthetic Indian Railways Operational Data)",
        "sih_problem_id": "SIH26028",
        "ministry": "Ministry of Railways",
        "docs_url": "/docs",
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
