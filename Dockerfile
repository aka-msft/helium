FROM node:dubnium

WORKDIR /app

COPY . .

RUN chmod +x ./scripts/start-service.sh \
    && npm install

EXPOSE 8080

ENTRYPOINT [ "bash", "-c", "./scripts/start-service.sh" ]