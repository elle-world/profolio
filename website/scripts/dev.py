#!/usr/bin/env python3
"""Local dev server for the static portfolio site.

Supports `npm run dev -- --port 7100 --host 0.0.0.0` and PORT/HOST env vars.
"""
import argparse
import functools
import http.server
import os
import socketserver
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the portfolio site locally.")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "3000")))
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"))
    args = parser.parse_args()

    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))

    class Server(socketserver.TCPServer):
        allow_reuse_address = True

    with Server((args.host, args.port), handler) as httpd:
        print(f"Serving {ROOT} at http://{args.host}:{args.port}/")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
