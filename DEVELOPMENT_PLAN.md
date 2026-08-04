# \# 🛠 CyberWatch Development Plan

#

#

# \## Goal

#

# Build a small but realistic cybersecurity monitoring platform.

#

#

# The priority is:

#

# 1\. Functional application

# 2\. Clean architecture

# 3\. Security

# 4\. Demonstration quality

#

#

# \---

#

# \# Phase 1 — Frontend

#

#

# Create React application.

#

#

# Stack:

#

#

# \- React

# \- TypeScript

# \- Vite

# \- Chakra UI

#

#

# Features:

#

#

# \## Authentication UI

#

# Pages:

#

# \- Login

#

#

# \## Dashboard

#

# Display:

#

# \- Risk score

# \- Scan history

# \- Vulnerabilities

#

#

# \## Companies

#

#

# CRUD:

#

#

# \- create company

# \- list companies

#

#

# \## Scan

#

#

# Button:

#

#

# START SCAN

#

#

# Display:

#

# \- running status

# \- results

#

#

# \---

#

# \# Phase 2 — Go API

#

#

# Create:

#

#

# \- Gin server

# \- routes

# \- services

# \- database layer

#

#

# Endpoints:

#

#

#

# GET /companies

#

# POST /companies

#

# POST /scans

#

# GET /scans/:id

#

# GET /dashboard

#

#

#

# \---

#

# \# Phase 3 — PostgreSQL

#

#

# Create models:

#

#

# Company

#

# Scan

#

# Finding

#

#

# Add migrations.

#

#

# \---

#

# \# Phase 4 — Keycloak

#

#

# Setup:

#

#

# Realm:

#

#

# cyberwatch

#

#

#

# Clients:

#

#

# frontend

# api

#

#

#

# Roles:

#

#

#

# ADMIN

#

# ANALYST

#

#

#

# \---

#

# \# Phase 5 — Python Scanner

#

#

# Create worker.

#

#

# Modules:

#

#

#

# scanner/

#

# ├── dns.py

#

# ├── http.py

#

# ├── technology.py

#

# ├── risk.py

#

#

#

# Example:

#

#

# Input:

#

#

# example.com

#

#

#

# Output:

#

#

#

# IP found

#

# HTTPS enabled

#

# Missing CSP header

#

# Risk Score 75

#

#

#

# \---

#

# \# Phase 6 — RabbitMQ

#

#

# Create queue:

#

#

#

# scan_jobs

#

#

#

# Go:

#

# publish job

#

#

# Python:

#

# consume job

#

#

# \---

#

# \# Phase 7 — Redis

#

#

# Cache:

#

#

# \- dashboard statistics

# \- scan status

#

#

# \---

#

# \# Phase 8 — Elasticsearch

#

#

# Store:

#

#

# \- worker logs

# \- scan events

#

#

# \---

#

# \# Phase 9 — Docker

#

#

# Services:

#

#

#

# frontend

#

# api

#

# worker

#

# postgres

#

# keycloak

#

# rabbitmq

#

# redis

#

# elasticsearch

#

#

#

# \---

#

# \# Phase 10 — Demo Preparation

#

#

# Demo scenario:

#

#

# 1\. Login with Keycloak

#

# 2\. Add company

#

# 3\. Start scan

#

# 4\. Worker executes scan

#

# 5\. Results appear

#

#

# Presentation message:

#

#

# "I built a simplified External Attack Surface Monitoring platform using a distributed architecture close to real cybersecurity products."
