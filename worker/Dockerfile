# CyberWatch Python scanner worker.
#
# Build context: worker/
# Default CMD = RabbitMQ consumer (Compose SCAN_MODE=rabbitmq).
# Override in compose for HTTP mode:
#   command: ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]

FROM python:3.12-slim

WORKDIR /app

# -u: unbuffered logs in Compose; no .pyc clutter in image layers
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

CMD ["python", "-m", "app.consumer"]
