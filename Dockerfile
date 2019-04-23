# ---- Base Node ----
FROM node:dubnium-alpine AS base
WORKDIR /app
COPY package.json .
 
#
# ---- Dependencies ----
FROM base AS dependencies
RUN npm set progress=false && npm config set depth 0
RUN npm install --production 
RUN cp -R node_modules prod_node_modules
RUN npm install
 
#
# ---- Test ----
# run linters, setup and tests
FROM dependencies AS test
COPY . .
RUN  npm run lint && npm run build && npm run test
 
#
# ---- Release ----
FROM base AS release
COPY --from=dependencies /app/prod_node_modules ./node_modules
COPY . .
RUN chmod +x ./scripts/start-service.sh
EXPOSE 3000
ENTRYPOINT [ "sh", "./scripts/start-service.sh" ]