"""
Shared Rate Limiter instance.

Separated into its own module to avoid circular imports between
main.py (which registers it on the app) and routers/posts.py
(which decorates endpoints with it).
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
