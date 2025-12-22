import secrets
from datetime import datetime, timedelta

def generate_reset_token():
    token = secrets.token_hex(16)
    expiry = datetime.utcnow() + timedelta(minutes=30)
    return token, expiry