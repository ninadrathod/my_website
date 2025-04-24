FROM node:latest

# Set a working directory inside the image
WORKDIR /app
COPY package*.json ./

ENV START_COMMAND="npm run dev"
# Create a simple HTTP server using 'serve' package
RUN npm install

COPY . .
RUN npm install -g serve
RUN npm install tailwindcss @tailwindcss/cli
# Expose the port the server will listen on
EXPOSE 3000

# Command to start the simple HTTP server
CMD [ "sh", "-c", "$START_COMMAND" ]
