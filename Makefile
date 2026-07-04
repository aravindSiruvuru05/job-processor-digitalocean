.PHONY: install infra infra-down up up-detached down logs frontend test test-integration clean

# Install dependencies for all three services (needed for local runs / tests)
install:
	cd api && npm install
	cd worker && npm install
	cd frontend && npm install

# Bring up only Postgres + Redis and wait for them to be healthy
infra:
	docker compose up -d postgres redis
	@echo "Waiting for postgres + redis to be healthy..."
	@until [ "$$(docker inspect -f '{{.State.Health.Status}}' job_processor_postgres 2>/dev/null)" = "healthy" ] && \
	        [ "$$(docker inspect -f '{{.State.Health.Status}}' job_processor_redis 2>/dev/null)" = "healthy" ]; do \
		sleep 1; \
	done
	@echo "Infra is ready."

infra-down:
	docker compose down

# Dev environment: Postgres + Redis + API + worker, all in Docker with hot reload.
# Source is bind-mounted, so code changes reload automatically.
# Run the frontend separately with `make frontend`.
up:
	docker compose up --build

up-detached:
	docker compose up --build -d

# Stop and remove all containers
down:
	docker compose down

# Tail api + worker logs
logs:
	docker compose logs -f api worker

# Frontend runs on the host (talks to the API at http://localhost:3000)
frontend:
	cd frontend && npm run dev

# Run unit tests across all projects (on the host)
test:
	cd api && npm test
	cd worker && npm test
	cd frontend && npm test

# Run API HTTP integration tests (spins up ephemeral Postgres + Redis via Testcontainers; requires Docker)
test-integration:
	cd api && npm run test:integration

clean:
	rm -rf api/node_modules api/dist worker/node_modules worker/dist frontend/node_modules frontend/dist
