"""Start an isolated in-memory API, run integration tests, then stop it."""

from __future__ import annotations

import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.request import urlopen

BACKEND_DIR = Path(__file__).resolve().parent
HOST = "127.0.0.1"


def available_port() -> int:
    configured = os.environ.get("TECSERVICE_TEST_PORT")
    if configured:
        return int(configured)
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind((HOST, 0))
        return int(listener.getsockname()[1])


PORT = available_port()
API_ROOT = f"http://{HOST}:{PORT}/api"


def wait_until_ready(process: subprocess.Popen, timeout: float = 30.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError("The local test API stopped before it became ready")
        try:
            with urlopen(f"{API_ROOT}/", timeout=1) as response:
                if response.status == 200:
                    return
        except (URLError, TimeoutError):
            time.sleep(0.2)
    raise RuntimeError("Timed out waiting for the local test API")


def main() -> int:
    server_env = os.environ.copy()
    server_env.update(
        {
            "USE_IN_MEMORY_DB": "true",
            "DB_NAME": "tecservice_test",
            "CORS_ORIGINS": "http://localhost:3000",
            "AUTH_DISABLED": "true",
            "PYTHONUTF8": "1",
        }
    )
    test_env = server_env.copy()
    test_env.update(
        {
            "TEST_BASE_URL": API_ROOT,
            "TECSERVICE_TEST_MODE": "in_memory",
        }
    )

    server = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "server:app",
            "--host",
            HOST,
            "--port",
            str(PORT),
        ],
        cwd=BACKEND_DIR,
        env=server_env,
    )
    try:
        integrity = subprocess.run(
            [sys.executable, "integrity_test.py"],
            cwd=BACKEND_DIR,
            env=test_env,
            check=False,
        )
        if integrity.returncode != 0:
            return integrity.returncode
        auth_integrity = subprocess.run(
            [sys.executable, "auth_integrity_test.py"],
            cwd=BACKEND_DIR,
            env=test_env,
            check=False,
        )
        if auth_integrity.returncode != 0:
            return auth_integrity.returncode
        assistant = subprocess.run(
            [sys.executable, "assistant_test.py"],
            cwd=BACKEND_DIR,
            env=test_env,
            check=False,
        )
        if assistant.returncode != 0:
            return assistant.returncode
        wait_until_ready(server)
        completed = subprocess.run(
            [sys.executable, "backend_test.py"],
            cwd=BACKEND_DIR,
            env=test_env,
            check=False,
        )
        return completed.returncode
    finally:
        server.terminate()
        try:
            server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait(timeout=5)


if __name__ == "__main__":
    raise SystemExit(main())
