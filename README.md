# Botty Test

A simple NestJS backend for managing requests, queueing jobs, and integrating with RabbitMQ and Prisma (PostgreSQL).

## Features

- REST API for creating and listing requests
- Request persistence using Prisma ORM and PostgreSQL
- Asynchronous job processing via RabbitMQ
- Worker service to process queued requests and update their status
- Modular codebase for easy extension

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- pnpm (or npm/yarn)
- Docker (for local PostgreSQL and RabbitMQ)

### Installation

1. Clone the repo:
   ```sh
   git clone https://github.com/your-username/botty-test.git
   cd botty-test
   ```
2. Install dependencies:
   ```sh
   pnpm install
   ```
3. Copy `.env.example` to `.env` and set your environment variables (DB, RabbitMQ, etc).

### Running Locally

Start services with Docker Compose:

```sh
pnpm run docker:up
```

Run the backend in dev mode:

```sh
pnpm run start:dev
```

Start the worker:

```sh
pnpm run start:worker
```

### API Endpoints

- `POST /requests` — create a new request (body: `{ text: string }`)
- `GET /requests` — list all requests

### Testing

Run unit and integration tests:

```sh
pnpm test
```

## Development Notes

- Main logic is in `src/requests` and `src/queue`
- Prisma models are in `prisma/schema.prisma`
- Worker logic is in `src/worker/worker.bootstrap.ts`
- Environment variables control DB and queue connections
