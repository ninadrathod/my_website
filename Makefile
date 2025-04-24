# Define project paths
BACKEND_DIR := backend
FRONTEND_DIR := frontend

# Target to install backend dependencies
backend_install:
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && npm install
	@echo "Backend dependencies installed."

# Target to install frontend dependencies
frontend_install:
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install
	@echo "Frontend dependencies installed."

# Target to build and start the Docker Compose application
build: 
	@echo "Building and starting Docker Compose application..."
	docker-compose up -d --build
	docker exec -d -it frontend npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
	@echo "Docker Compose application is running."

initial_build: backend_install frontend_install build

up:
	@echo "Building and starting Docker Compose application..."
	docker-compose up -d
	docker exec -d -it frontend npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
	@echo "Docker Compose application is running."

# Optional target to stop and remove containers
down:
	@echo "Stopping and removing Docker Compose containers..."
	docker-compose down
	@echo "Docker Compose containers stopped and removed."

# Optional target to rebuild the Docker images
rebuild: down build

destroy_project:
	@echo "Destroying all containers"
	docker-compose down
	docker image prune
	docker volume prune
	docker network prune
	docker system prune -a --volumes
	docker system prune -a
	@echo "All project containers destroyed"
	@echo "Deleting node modules and other residual files"
	cd $(BACKEND_DIR) && rm -rf node_modules
	cd $(BACKEND_DIR) && rm package-lock.json
	cd $(FRONTEND_DIR) && rm -rf node_modules
	cd $(FRONTEND_DIR) && rm package-lock.json
	cd $(FRONTEND_DIR) && rm src/output.css
	@echo "Deleted"

.PHONY: backend_install frontend_install initial_build build down rebuild destroy_project