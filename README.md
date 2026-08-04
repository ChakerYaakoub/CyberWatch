# 🛡️ CyberWatch
## External Attack Surface Monitoring Platform

![CyberWatch](https://img.shields.io/badge/Project-CyberWatch-blue)
![React](https://img.shields.io/badge/Frontend-React%20TypeScript-61DAFB)
![Go](https://img.shields.io/badge/API-Go-00ADD8)
![Python](https://img.shields.io/badge/Scanner-Python-3776AB)
![Keycloak](https://img.shields.io/badge/Auth-Keycloak-red)
![RabbitMQ](https://img.shields.io/badge/Message-Broker-orange)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)


# 📌 Project Overview

CyberWatch is a simplified **External Attack Surface Monitoring Platform** inspired by cybersecurity platforms such as AlgoSecure AlgoLightHouse.

The objective is to build a complete full-stack distributed application capable of:

- managing monitored companies
- launching external security scans
- analyzing publicly available information
- detecting security weaknesses
- calculating a risk score
- displaying results through a security dashboard


The project demonstrates:

- React frontend development
- Go backend API
- Python security workers
- asynchronous processing
- IAM authentication
- distributed architecture


---

# 🎯 Business Context

Modern companies expose many assets on the Internet:

- domains
- websites
- APIs
- servers
- technologies
- public services


CyberWatch helps security analysts answer:

> "What information is publicly exposed and what represents a potential security risk?"


---

# 🚀 MVP Scope

CyberWatch implements a realistic but lightweight security scanner.

The scanner performs passive external analysis:


## DNS Analysis

Collect:

- IP address
- DNS resolution status


Example:


Domain:
example.com

IP:
93.xxx.xxx.xxx

DNS:
Available



---

## HTTP Security Analysis

The scanner checks:

- HTTPS availability
- HTTP response
- Security headers


Detected headers:

- Strict-Transport-Security
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options


Example:



Missing Security Header:

Content-Security-Policy

Severity:

MEDIUM



---

## Technology Detection

The scanner analyzes:

- HTTP headers
- HTML content
- server information


Example:



Detected Technologies:

Nginx
React



---

## Exposure Detection

The scanner checks common services:


Ports:


80
443
22
21
3306
5432



Example:


Open Service:

443 HTTPS

Risk:

LOW



---

## Risk Calculation

The system generates a security score.


Example:



Security Score:

72 / 100

Risk Level:

MEDIUM



The score is calculated from detected findings.


---

# 🏗️ Architecture


                User

                 |

                 |

        React + Chakra UI

                 |

                 |

          Keycloak IAM

                 |

                 |

          Go API Backend

                 |

    ----------------------------

    |                          |

PostgreSQL RabbitMQ

                              |

                              |

                     Python Scanner Worker

                              |

            --------------------------------

            |              |               |

          DNS            HTTP          Security

         Scanner        Scanner        Checks


                              |

                              |

                     Elasticsearch Logs


---

# 🧰 Technology Stack


# Frontend

React + TypeScript

Chakra UI

React Router

TanStack Query

Axios

Recharts

oidc-client-ts


Responsibilities:

- authentication UI
- dashboard
- company management
- scan results visualization


---

# Backend API

## Go Service


Technologies:

- Go
- Gin
- GORM
- PostgreSQL


Responsibilities:

- REST API
- business logic
- JWT validation
- communication with workers
- database management


---

# Authentication

## Keycloak


Used as Identity Provider.


Features:

- OAuth2
- OpenID Connect
- JWT
- Role Based Access Control


Roles:


## ADMIN

Permissions:

- manage users
- manage companies
- access all reports


## ANALYST

Permissions:

- create scans
- view results
- analyze vulnerabilities


---

# Python Security Worker


Technologies:

- Python
- RabbitMQ
- Pika
- Requests
- BeautifulSoup
- dnspython


Responsibilities:

- consume scan jobs
- execute security checks
- calculate risk
- save results


---

# Message Broker

## RabbitMQ


Used for asynchronous scan execution.


Flow:



User starts scan

   |

   |

Go API creates job

   |

   |

RabbitMQ Queue

   |

   |

Python Worker

   |

   |

Save Results



---

# Database


## PostgreSQL


Tables:


## companies


id
name
domain
created_at



## scans


id
company_id
status
risk_score
created_at
finished_at



## vulnerabilities


id
scan_id
title
severity
description



---

# Redis


Used for caching:


Examples:



dashboard_statistics

company_scan_status



---

# Elasticsearch


Used for:


- worker logs
- security events
- scan history


Example:



{
service:"scanner",

level:"WARNING",

message:"Missing HTTPS security header"

}



---

# 📂 Project Structure



CyberWatch/

├── frontend/

│

├── backend-api/

│

├── worker/

│

├── infrastructure/

│

└── README.md



---

# Development Order


The project must be developed in this order:


## 1. React + Chakra UI

Create:

- Login page
- Dashboard
- Companies page
- Scan results page


---

## 2. Go API

Create:

- REST endpoints
- PostgreSQL connection
- Authentication middleware


---

## 3. PostgreSQL

Create:

- database models
- migrations


---

## 4. Keycloak

Implement:

- login
- JWT validation
- roles


---

## 5. Python Worker

Implement:

- RabbitMQ consumer
- DNS scanner
- HTTP scanner
- Security checks


---

## 6. RabbitMQ

Connect:

Go API → Worker


---

## 7. Redis

Add caching.


---

## 8. Elasticsearch

Add logs.


---

## 9. Docker Compose

Containerize services.


---

## 10. CI/CD

Add GitHub Actions.


---

# 🔒 Security Rules


Always:


- never store secrets in code
- use environment variables
- validate inputs
- protect APIs
- follow secure coding practices


---

# 🎯 Project Objective


This project demonstrates the ability to build:

- secure full-stack applications
- distributed systems
- cybersecurity oriented platforms
- scalable architectures


Inspired by:

AlgoSecure AlgoLightHouse technical environment.