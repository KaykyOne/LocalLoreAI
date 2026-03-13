from fastapi import FastAPI
from app.router.bot import router as bot_router

def create_app():
    app = FastAPI(
        title="AICosmic API",
        description="API for AI-powered RPG narration",
        version="1.0.0"
    )
    
    # Registrar routers
    app.include_router(bot_router, prefix="/api/bot", tags=["bot"])
    
    return app

app = create_app()
