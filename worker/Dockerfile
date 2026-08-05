FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Default: RabbitMQ consumer (override for HTTP/dev, e.g. uvicorn)
CMD ["python", "-m", "app.consumer"]
