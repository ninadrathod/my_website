# Define project paths
BACKEND_DIR := backend
FRONTEND_DIR := frontend
UPLOAD_SERVICE_DIR := upload-service

setup-images-dir:
	@echo "Ensuring upload-service/images directory exists and has write permission..."
	mkdir -p $(UPLOAD_SERVICE_DIR)/images
	chmod 777 $(UPLOAD_SERVICE_DIR)/images 

# Target to install backend dependencies
backend_install:
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && npm install
	@echo "Backend dependencies installed."

# Target to install backend dependencies
upload_service_install:
	@echo "Installing upload service dependencies..."
	npm install --prefix ./$(UPLOAD_SERVICE_DIR)
	@echo "Upload service dependencies installed."

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
	python3 load_data.py
	@echo "Docker Compose application is running."


initial_build: setup-images-dir backend_install upload_service_install frontend_install build

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
	@echo "Destroying all containers, images, volumes, and networks..."
	docker-compose down --volumes --rmi all # Stop and remove containers, volumes, and images
	docker system prune -a --volumes -f # Aggressively prune everything
	@echo "All Docker resources related to project destroyed."
	@echo "Deleting node modules and other residual files from host directories..."
	rm -rf $(BACKEND_DIR)/node_modules $(BACKEND_DIR)/package-lock.json
	rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/package-lock.json $(FRONTEND_DIR)/src/output.css
	rm -rf $(UPLOAD_SERVICE_DIR)/node_modules $(UPLOAD_SERVICE_DIR)/package-lock.json $(UPLOAD_SERVICE_DIR)/images/*
	@echo "Clean-up complete."

.PHONY: backend_install upload_service_install frontend_install initial_build build up down rebuild destroy_project