# CyberWatch Go API — multi-stage build (small runtime image, non-root).
#
# Build context: backend-api/
# Compose service: backend-api → :8080

# --- Build stage: compile static binary ---
FROM golang:1.23-alpine AS builder

WORKDIR /src

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO off → pure Go binary that runs on alpine without glibc deps
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/server ./cmd/server

# --- Runtime stage ---
FROM alpine:3.20

# wget used by HEALTHCHECK and Compose healthcheck
RUN apk add --no-cache ca-certificates wget \
  && adduser -D -H -u 10001 appuser

WORKDIR /app

COPY --from=builder /out/server /app/server

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["/app/server"]
