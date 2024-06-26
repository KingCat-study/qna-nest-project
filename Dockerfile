FROM node:22.3.0

WORKDIR /usr/src/qna_nest_app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:dev"]