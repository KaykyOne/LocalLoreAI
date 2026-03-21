
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.service import bot
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.post("/send_message")
def send_message(
    message: str = Query(...),
):
    def generate():
        for token in bot.sendMessageForIAStream(message):
            yield token

    return StreamingResponse(generate(), media_type="text/plain")

    
@router.post("/start_word")
def start_word(
    trats: str = Query(...),
):
    def generate():
        for token in bot.createWordStream(trats):
            yield token

    return StreamingResponse(generate(), media_type="text/plain")