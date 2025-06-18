FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=3002
EXPOSE $PORT

CMD ["npm", "start"]
