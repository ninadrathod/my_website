FROM node:20-alpine

# Set a common working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if present) first.
# This allows Docker to cache the 'npm install' step.
COPY package*.json ./

# Install dependencies.
# If you uncomment 'npm run start' for production, consider 'npm ci --only=production' here
# to avoid installing devDependencies. For now, 'npm install' is fine for dev.
RUN npm install

# Copy the rest of the application code into the container.
# This copies server.js and any other source files from the backend directory.
COPY . .

# Define environment variables with defaults directly in the Dockerfile.
# Note: These values can still be overridden by the 'environment' section
# in your docker-compose.yml, which is typically desired for deployment flexibility.
ENV PORT=3001
ENV MONGODB_URI=mongodb://mongodb:27017/resume_database

# Set the default command to run the application.
# Using 'npm run dev' implies nodemon is intended for use in this container,
# which is common for development environments.
# If this were a production image, you'd likely use 'npm run start'.
CMD ["npm", "run", "dev"]

# Example: Uncomment the below line and comment the 'CMD' above for a production setup
# CMD ["npm", "run", "start"]

# Expose the port where the application will listen.
# This informs Docker that the container listens on this port at runtime.
EXPOSE $PORT