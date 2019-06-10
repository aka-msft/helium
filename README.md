# Helium - WORK IN PROGRESS

A reference app for using the Azure Web App for Containers service.

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Development

### Install dependencies

1. Clone the repository
2. Open a terminal in the local repo directory
3. [Follow CosmosDB instructions to set up KeyVault and CosmosDB](./docs/azure-infrastructure.md#create-and-setup-a-cosmosdb)
4. Add the App Insights Instrumentation key to KeyVault. Call it `AppInsightsInstrumentationKey`.
5. Run `npm install`

#### No KeyVault

If you don't want to use KeyVault, set these environment variables:

```
export COSMOSDB_KEY="cosmosdb_key"
export APPINSIGHTS_INSTRUMENTATIONKEY="instrumentation_key"
```

### Build (Transpile to JS)

1. `npm run build` will transpile source files from the `src/` directory into a destination directory named `dist/`.  Console output should appear as follows:

```
user@MININT-###### MINGW64 /c/users/<user>/repos/helium (<user>/<branch>)
$ npm run build

> helium@1.0.0 build C:\users\<user>\repos\helium
> gulp scripts

[11:28:19] Using gulpfile C:\users\<user>\repos\helium\gulpfile.js
[11:28:19] Starting 'scripts'...
[11:28:21] Finished 'scripts' after 1.97 s
```

### Test (Unit tests)

1. Create your unit test file in the `src/tests/` directory.  Name your test as `*.unit.ts`.
2. From the project root, run `npm run test-unit` in the terminal.
3. Output should show that your test ran.

### Test (Integration Tests)

1. Create your integration test file  in the `src/tests/` directory.  Name your test as `*.integration.ts`.
2. Use either Docker or Docker Compose shown in the instructions below to run the integration test locally.
3. Output should show that your test ran.

#### Docker

```
docker build --build-arg integration_server_url=<endpoint_url> --target=integration -t  helium:canary .
docker run -it -p 3000:3000  helium:canary
```

#### Docker Compose

Docker Compose builds and runs the services detailed in the `docker-compose.yml` file.

```
docker-compose build # Services are built and tagged
docker-compose up # Builds, (re)creates, starts, and attaches to containers for a service. Also starts any linked services
```

Note: Environment variables can be defined either directly or by referencing a `.env `file in the YAML file. Below is an example of what a `.env` file would look like for the helium app:

helium-release.env
```
CLIENT_ID=client_id
CLIENT_SECRET=client_secret
TENANT_ID=tenant_id
KEY_VAULT_URL=key_vault_url
COSMOSDB_URL=cosmosdb_url
```

### Run dev server

1. `npm start` will start the server locally.  If no environment variable is provided, the application will run on the default port defined in `server.ts`.
2. Once running, the API can be accessed at each of [https://github.com/Microsoft/helium/tree/master/src/app/routes](these routes).

### Docker

#### Build

```
docker build --target=release -t helium:canary . #production
docker build --target=test -t helium:canary . #dev
```

#### Run

#### With KeyVault

```
docker run -it -p 3000:3000 \
  -e CLIENT_ID='client_id' \
  -e CLIENT_SECRET='client_secret' \
  -e TENANT_ID='tenant_id' \
  -e KEY_VAULT_URL='https://keyvaultname.vault.azure.net/' \
  -e COSMOSDB_URL='https://cosmosname.documents.azure.com:443/' \
  helium:canary
```

#### Without KeyVault

```
docker run -it -p 3000:3000 \
  -e COSMOSDB_KEY="your_key" \
  -e APPINSIGHTS_INSTRUMENTATIONKEY="your_key" \
  -e COSMOSDB_URL='https://cosmosname.documents.azure.com:443/' \
  helium:canary
```

### Docker Compose

#### Build

```
docker-compose build # Services in docker-compose.yml are built and tagged
```

#### Run

```
docker-compose up # Builds, (re)creates, starts, and attaches to containers for a service. Also starts any linked services
OR
docker-compose up --abort-on-container-exit # Stops all containers if one container exits
```

## Documentation

### REST Endpoints

The REST endpoints are documented using the OpenAPI 3.0 standard (https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md) and uses swagger-jsdoc (https://github.com/Surnet/swagger-jsdoc) to generate the swagger spec.
