"""Vercel entrypoint: Vercel's Python runtime looks for an ASGI `app` in index.py.
Locally and in Docker the app is started as `app.main:app` instead."""

from app.main import app

__all__ = ["app"]
