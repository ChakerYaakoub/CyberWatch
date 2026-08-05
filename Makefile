# CyberWatch — run from repo root
# Requires: Docker Compose v2, Make (Git Bash / WSL / chocolatey make)

COMPOSE := docker compose --project-directory infrastructure -f infrastructure/docker-compose.yml

.PHONY: start stop logs status

start:
	$(COMPOSE) up --build

stop:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

status:
	$(COMPOSE) ps
