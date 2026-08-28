# syntax=docker/dockerfile:1.7

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
COPY requirements-prod.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements-prod.txt

RUN groupadd --system app && useradd --system --gid app --home-dir /app app
COPY --chown=app:app . ./
USER app

EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]
