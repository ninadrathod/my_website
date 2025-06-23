FROM node:20-alpine

# Set a working directory inside the image
WORKDIR /app

# Copy package.json and package-lock.json (if present) first.
# This optimizes Docker's build cache: if only source code changes, npm install won't re-run.
COPY package*.json ./

# Install project dependencies
RUN npm install

# Install 'serve' globally. This is needed because your package.json scripts
# directly call 'serve'. If you were using 'npm start', this wouldn't be strictly
# necessary if 'serve' was a local dependency and called via 'npx serve'.
RUN npm install -g serve

# Copy the rest of the application code into the container
COPY . .

# Define environment variables with defaults (can be overridden by docker-compose.yml)
ENV PORT=3000

# Expose the port the server will listen on
EXPOSE $PORT

# Command to start the application using the 'dev' script from package.json
CMD [ "npm", "run", "dev" ]