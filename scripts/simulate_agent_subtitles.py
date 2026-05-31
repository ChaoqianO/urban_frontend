"""Emit demo Agent event_log messages through the Bridge Socket.IO /agent namespace.

Run while the frontend is open and connected to the Bridge:
    python scripts/simulate_agent_subtitles.py
"""

from __future__ import annotations

import argparse
import time
from typing import Iterable

import socketio


DEFAULT_URL = "http://127.0.0.1:5000"
NAMESPACE = "/agent"

STEPS: tuple[tuple[str, str], ...] = (
    ("warn", "accepted subtitle-demo-01 target=UAV-01 kind=UAV_PATROL"),
    ("danger", "completed subtitle-demo-02 target=UAV-01 kind=UAV_GOTO"),
    ("danger", "accepted subtitle-demo-03 target=UGV-01 kind=UGV_GOTO"),
    ("warn", "completed subtitle-demo-04 target=UGV-01 kind=UGV_GOTO"),
    ("warn", "accepted subtitle-demo-05 target=UGV-01 kind=UGV_EXTINGUISH"),
    ("ok", "completed subtitle-demo-06 target=UGV-01 kind=UGV_EXTINGUISH"),
    ("info", "accepted subtitle-demo-07 target=UAV-01 kind=UAV_RTL"),
    ("ok", "completed subtitle-demo-08 target=UAV-01 kind=UAV_RTL"),
)


def emit_steps(url: str, delay: float, steps: Iterable[tuple[str, str]]) -> None:
    sio = socketio.Client(reconnection=False, logger=False, engineio_logger=False)

    @sio.event(namespace=NAMESPACE)
    def connect() -> None:
        print(f"connected to {url}{NAMESPACE}")

    @sio.event(namespace=NAMESPACE)
    def disconnect() -> None:
        print("disconnected")

    print(f"connecting to {url}{NAMESPACE} ...")
    sio.connect(url, namespaces=[NAMESPACE], transports=["polling"], wait_timeout=5)
    try:
        for severity, message in steps:
            payload = {
                "timestamp": time.time(),
                "severity": severity,
                "message": message,
            }
            print(f"emit event_log: {severity} {message}")
            sio.emit("event_log", payload, namespace=NAMESPACE)
            time.sleep(delay)
    finally:
        sio.disconnect()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_URL, help="Bridge base URL")
    parser.add_argument("--delay", type=float, default=1.4, help="Seconds between events")
    args = parser.parse_args()
    emit_steps(args.url, args.delay, STEPS)


if __name__ == "__main__":
    main()
