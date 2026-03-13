
from fastapi import APIRouter, Depends, HTTPException, Query, status
import service.bot

bot = service.bot

router = APIRouter()

@router.post("/send_message")
def send_message(
    message: str = Query(..., description="The message to send"),
    recipient_id: int = Query(..., description="The ID of the recipient"),
):
    bot.sendMessageForIA(message, recipient_id)
    return {"status": "Message sent successfully"}

    