.PHONY: help migrate-up migrate-down migrate-create test run

help:
	@echo "Available commands:"
	@echo "  make migrate-up      - Apply all database migrations"
	@echo "  make migrate-down    - Rollback last migration"
	@echo "  make migrate-create  - Create a new migration (usage: make migrate-create name=migration_name)"
	@echo "  make test            - Run all tests"
	@echo "  make run             - Run the application"

migrate-up:
	@if [ -z "$(DB_URL)" ]; then \
		export $$(cat .env | xargs) && \
		migrate -path migrations -database "postgresql://$$DB_USER:$$DB_PASSWORD@$$DB_HOST:$$DB_PORT/$$DB_NAME?sslmode=$$DB_SSLMODE" up; \
	else \
		migrate -path migrations -database "$(DB_URL)" up; \
	fi

migrate-down:
	@if [ -z "$(DB_URL)" ]; then \
		export $$(cat .env | xargs) && \
		migrate -path migrations -database "postgresql://$$DB_USER:$$DB_PASSWORD@$$DB_HOST:$$DB_PORT/$$DB_NAME?sslmode=$$DB_SSLMODE" down 1; \
	else \
		migrate -path migrations -database "$(DB_URL)" down 1; \
	fi

migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "Error: name parameter is required. Usage: make migrate-create name=migration_name"; \
		exit 1; \
	fi
	migrate create -ext sql -dir migrations -seq $(name)

test:
	go test -v ./...

test-property:
	go test -v ./... -run Property

run:
	go run cmd/main.go


.PHONY: create-admin
create-admin:
	@echo "Creating admin user..."
	@go run cmd/create-admin/main.go

.PHONY: run
run:
	@echo "Starting server..."
	@go run cmd/server/main.go

.PHONY: build
build:
	@echo "Building server..."
	@go build -o bin/server cmd/server/main.go

.PHONY: test
test:
	@echo "Running tests..."
	@JWT_SECRET=test-secret go test -v ./...

.PHONY: test-short
test-short:
	@echo "Running short tests (skipping property tests)..."
	@JWT_SECRET=test-secret go test -short -v ./...
