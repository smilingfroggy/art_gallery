FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production
COPY . .

ENV PORT 8080
EXPOSE $PORT

CMD ["npm", "start"]