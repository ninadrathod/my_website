FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker's build cache
COPY package*.json ./

# Install dependencies inside the container
# This will create the node_modules directory within the container's image layer
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Define environment variables with defaults
ENV PORT=3002

# Expose the port where the application will listen
EXPOSE $PORT

# Command to run the application (using 'npm start' as it's typically for production)
CMD ["npm", "start"]