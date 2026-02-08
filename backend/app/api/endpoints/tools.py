from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
import segno
import io

router = APIRouter()

@router.get("/qr")
async def generate_qr(
    url: str = Query(..., description="The URL to encode in the QR code"),
    scale: int = Query(10, description="Scale of the QR code"),
    border: int = Query(1, description="Border size of the QR code"),
    dark: str = Query("#000000", description="Color of the dark modules"),
    light: str = Query(None, description="Color of the light modules (background)"),
):
    """
    Generate a QR code image (PNG) for the given URL.
    """
    try:
        qr = segno.make(url, error='h')
        out = io.BytesIO()
        qr.save(out, kind='png', scale=scale, border=border, dark=dark, light=light)
        out.seek(0)
        return Response(content=out.read(), media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
