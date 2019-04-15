FROM node:dubnium

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 80

CMD [ "./scripts/start-service.sh" ]