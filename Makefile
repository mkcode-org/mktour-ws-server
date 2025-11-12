.PHONY: build push deploy clean help

# Load environment variables from .env file
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Variables
DOCKER_IMAGE := sukalov/mktour
DOCKER_TAG := latest
PLATFORM := linux/amd64
CONTAINER_NAME := mktour-ws
SERVICE_NAME := mktour-ws

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker image locally for target platform
	@echo "Building Docker image $(DOCKER_IMAGE):$(DOCKER_TAG) for $(PLATFORM)..."
	docker buildx build --platform $(PLATFORM) -t $(DOCKER_IMAGE):$(DOCKER_TAG) --load .
	@echo "Build complete!"

push: ## Build and push Docker image to Docker Hub
	@echo "Building and pushing Docker image to Docker Hub for $(PLATFORM)..."
	docker buildx build --platform $(PLATFORM) -t $(DOCKER_IMAGE):$(DOCKER_TAG) --push .
	@echo "Push complete!"

deploy: ## Build, push, and deploy to remote server
	@echo "Building and pushing Docker image for $(PLATFORM)..."
	docker buildx build --platform $(PLATFORM) -t $(DOCKER_IMAGE):$(DOCKER_TAG) --push .
	@echo "Deploying to remote server $(REMOTE_HOST)..."
	@echo "Pulling latest image on remote server..."
	ssh $(REMOTE_HOST) "docker pull $(DOCKER_IMAGE):$(DOCKER_TAG)"
	@echo "Stopping and removing old container..."
	ssh $(REMOTE_HOST) "docker compose stop $(SERVICE_NAME) || true"
	ssh $(REMOTE_HOST) "docker compose rm -f $(SERVICE_NAME) || true"
	@echo "Starting new container..."
	ssh $(REMOTE_HOST) "docker compose up -d $(SERVICE_NAME)"
	@echo "Cleaning up old images on remote server..."
	ssh $(REMOTE_HOST) "docker image prune -f"
	@echo "Deployment complete!"
	@echo "Checking container status..."
	ssh $(REMOTE_HOST) "docker ps | grep $(CONTAINER_NAME)"

clean: ## Remove local Docker images
	@echo "Removing local Docker image..."
	docker rmi $(DOCKER_IMAGE):$(DOCKER_TAG) || true
	@echo "Cleaning up dangling images..."
	docker image prune -f
	@echo "Clean complete!"

logs: ## Show logs from remote container
	ssh $(REMOTE_HOST) "docker logs -f $(CONTAINER_NAME)"

status: ## Check status of remote container
	@echo "Container status on remote server:"
	ssh $(REMOTE_HOST) "docker ps -a | grep $(CONTAINER_NAME)"
	@echo ""
	@echo "Recent logs:"
	ssh $(REMOTE_HOST) "docker logs --tail 20 $(CONTAINER_NAME)"

restart: ## Restart remote container without rebuilding
	@echo "Restarting container on remote server..."
	ssh $(REMOTE_HOST) "docker compose restart $(SERVICE_NAME)"
	@echo "Restart complete!"
