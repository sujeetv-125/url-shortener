from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis
import os
import hashlib
import string
import random

app = FastAPI(title="URL Shortener API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
try:
    r = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
except Exception as e:
    print(f"Failed to connect to Redis: {e}")

class URLRequest(BaseModel):
    url: str

def generate_short_id(length=6):
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))

@app.get("/api/health")
def health_check():
    try:
        r.ping()
        redis_status = "connected"
    except Exception:
        redis_status = "disconnected"
    return {"status": "ok", "redis": redis_status}

@app.post("/api/shorten")
def shorten_url(request: URLRequest):
    if not request.url.startswith(("http://", "https://")):
        request.url = "https://" + request.url
    short_id = generate_short_id()
    r.setex(f"url:{short_id}", 86400, request.url)
    return {"short_code": short_id, "short_url": f"/r/{short_id}"}

@app.get("/r/{short_id}")
def redirect_url(short_id: str):
    long_url = r.get(f"url:{short_id}")
    if not long_url:
        raise HTTPException(status_code=404, detail="URL not found")
    return {"url": long_url}
