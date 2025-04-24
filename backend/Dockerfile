FROM node:latest

# Set a common working directory
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Define environment variables with defaults
ENV PORT=3001
ENV MONGO_URI=mongodb://mongodb:27017/resume_database
ENV START_COMMAND="npm run dev"

# uncomment below to run production server
# ENV START_COMMAND="npm run start"

# Expose the port (using the default PORT)
EXPOSE $PORT

# Command to run the application (can be overridden)
CMD [ "sh", "-c", "$START_COMMAND" ]