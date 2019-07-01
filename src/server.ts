import { telemetryTypeToBaseType } from "applicationinsights/out/Declarations/Contracts";
import * as bodyParser from "body-parser";
import { Container } from "inversify";
import { interfaces, InversifyRestifyServer, TYPE } from "inversify-restify-utils";
import "reflect-metadata";
import * as restify from "restify";
import * as swaggerJSDoc from "swagger-jsdoc";
import { ActorController } from "./app/controllers/actor";
import { GenreController } from "./app/controllers/genre";
import { MovieController } from "./app/controllers/movie";
import { SystemController } from "./app/controllers/system";
import { CosmosDBProvider } from "./db/cosmosdbprovider";
import { IDatabaseProvider } from "./db/idatabaseprovider";
import { BunyanLogger } from "./logging/bunyanLogProvider";
import { ILoggingProvider } from "./logging/iLoggingProvider";
import { KeyVaultProvider } from "./secrets/keyvaultprovider";
import { AppInsightsProvider } from "./telem/appinsightsprovider";
import { ITelemProvider } from "./telem/itelemprovider";
import { DateUtilities } from "./utilities/dateUtilities";
import EndpointLogger from "./middleware/EndpointLogger";

(async () => {
    /**
     * Create an Inversion of Control container using Inversify
     */
    const iocContainer: Container = new Container();

    /**
     * Bind the logging provider implementation that you want to use to the container
     */
    iocContainer.bind<ILoggingProvider>("ILoggingProvider").to(BunyanLogger).inSingletonScope();
    const log: ILoggingProvider = iocContainer.get<ILoggingProvider>("ILoggingProvider");

    const config: any = await getConfigValues(log);

    /**
     *  Bind the Controller classes for the Controllers you want in your server
     */
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(ActorController).whenTargetNamed("ActorController");
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(GenreController).whenTargetNamed("GenreController");
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(MovieController).whenTargetNamed("MovieController");
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(SystemController).whenTargetNamed("SystemController");

    /**
     * Bind the database provider & telemetry provider implementation that you want to use.
     * Also, bind the configuration parameters for the providers.
     */
    iocContainer.bind<IDatabaseProvider>("IDatabaseProvider").to(CosmosDBProvider).inSingletonScope();
    iocContainer.bind<string>("string").toConstantValue(config.cosmosDbUrl).whenTargetNamed("cosmosDbUrl");
    iocContainer.bind<string>("string").toConstantValue(config.cosmosDbKey).whenTargetNamed("cosmosDbKey");
    iocContainer.bind<string>("string").toConstantValue(config.insightsKey).whenTargetNamed("instrumentationKey");

    iocContainer.bind<ITelemProvider>("ITelemProvider").to(AppInsightsProvider).inSingletonScope();
    const telem: ITelemProvider = iocContainer.get<ITelemProvider>("ITelemProvider");

    const port: number = parseInt(process.env.PORT, 10) || 3000;

    // create restify server
    const server = new InversifyRestifyServer(iocContainer);

    log.Trace("Created the Restify server");

    try {
    // listen for requests
    server.setConfig((app) => {
        /**
         * Parse requests of content-type - application/x-www-form-urlencoded
         */
        app.use(bodyParser.urlencoded({ extended: true }));

        /**
         * Parses HTTP query string and makes it available in req.query.
         * Setting mapParams to false prevents additional params in query to be merged in req.Params
         */
        app.use(restify.plugins.queryParser({ mapParams: false }));

        /**
         * Set Content-Type as json for reading and parsing the HTTP request body
         */

        app.use(bodyParser.json());

        /**
         * Configure the requestlogger plugin to use Bunyan for correlating child loggers
         */
        app.use(restify.plugins.requestLogger());

        /**
         * Configure middleware function to be called for every endpoint.
         * This function logs the endpoint being called and measures duration taken for the call.
         */
        app.use(EndpointLogger(iocContainer));

        const options: any = {
            // Path to the API docs
            apis: [`${__dirname}/app/models/*.js`, `${__dirname}/app/controllers/*.js`],
            definition: {
                info: {
                    title: "Helium", // Title (required)
                    version: "1.0.0", // Version (required)
                },
                openapi: "3.0.2", // Specification (optional, defaults to swagger: '2.0')
            },
        };

        // Initialize swagger-jsdoc -> returns validated swagger spec in json format
        const swaggerSpec: any = swaggerJSDoc(options);

        log.Trace("Setting up swagger.json to serve statically");
        app.get("/swagger.json", (req, res) => {
            res.setHeader("Content-Type", "application/json");
            res.send(swaggerSpec);
        });

        log.Trace("Setting up index.html to serve static");
        app.get("/", (req, res) => {
            res.writeHead(200, {
                "Content-Length": Buffer.byteLength(html),
                "Content-Type": "text/html",
            });
            res.write(html);
            res.end();
        });

        log.Trace("Setting up node modules to serve statically");
        app.get("/node_modules/swagger-ui-dist/*", restify.plugins.serveStatic({
            directory: __dirname + "/..",
        }));
    }).build().listen(port, () => {
        log.Trace("Server is listening on port " + port);
        telem.trackEvent("API Server: Server started on port " + port);
    });

    } catch (err) {
        log.Error(Error(err), "Error in setting up the server!");
    }
})();

export async function getConfigValues(
    log: ILoggingProvider): Promise<{ cosmosDbKey: string, cosmosDbUrl: string, insightsKey: string }> {
    // cosmosDbKey comes from KeyVault or env var
    let cosmosDbKey: string;
    // insightsKey comes from KeyVault or env var
    let insightsKey: string;

    let configFallback: boolean;

    log.Trace("Getting configuration values");

    // try to get KeyVault connection details from env
    // Whether or not we have clientId and clientSecret, we want to use KeyVault
    const clientId: string = process.env.CLIENT_ID;
    const clientSecret: string = process.env.CLIENT_SECRET;

    if (clientId && !clientSecret) {
        log.Trace("CLIENT_ID env var set, but not CLIENT_SECRET");
        process.exit(1);
    }

    const tenantId: string = process.env.TENANT_ID;
    if (!tenantId) {
        log.Trace("No TENANT_ID env var set");
        configFallback = true;
    }

    const cosmosDbUrl: string = process.env.COSMOSDB_URL;
    if (!cosmosDbUrl) {
        log.Trace("No COSMOSDB_URL env var set");
        process.exit(1);
    }

    // first try KeyVault, then env var
    if (!configFallback) {
        const keyVaultUrl: string = process.env.KEY_VAULT_URL;

        log.Trace("Trying to read from keyvault " + keyVaultUrl);
        const keyvault: KeyVaultProvider = new KeyVaultProvider(keyVaultUrl, clientId, clientSecret, tenantId, log);
        try {
            cosmosDbKey = await keyvault.getSecret("cosmosDBkey");
            log.Trace("Got cosmosDBKey from keyvault");

            insightsKey = await keyvault.getSecret("AppInsightsInstrumentationKey");
            log.Trace("Got AppInsightsInstrumentationKey from keyvault");

        } catch {
            log.Error(Error(), "Failed to get secrets from KeyVault. Falling back to env vars for secrets");
        }

    } else {
        console.log("Unable to use KeyVault, falling back to env vars for secrets");
    }

    // if some secrets still don't exist, check env
    if (!cosmosDbKey) {
        log.Trace("Setting cosmosDbKey from environment variable");
        cosmosDbKey = process.env.COSMOSDB_KEY;
    }
    if (!insightsKey) {
        log.Trace("Setting AppInsightsInstrumentationKey from environment variable");
        insightsKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
    }

    // exit with failing code if still no secrets
    if (!cosmosDbKey) {
        log.Trace("Failed to get COSMOSDB_KEY");
        process.exit(1);
    }
    if (!insightsKey) {
        log.Trace("Failed to get APPINSIGHTS_INSTRUMENTATIONKEY");
        process.exit(1);
    }
    log.Trace("Returning config values");
    return {
        cosmosDbKey,
        cosmosDbUrl,
        insightsKey,
    };
}

const html: string = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Swagger UI</title>
                    <link rel="stylesheet" type="text/css" href="/node_modules/swagger-ui-dist/swagger-ui.css" >
                    <link rel="icon" type="image/png"
                    href="/node_modules/swagger-ui-dist/favicon-32x32.png" sizes="32x32" />
                    <link rel="icon" type="image/png"
                    href="/node_modules/swagger-ui-dist/favicon-16x16.png" sizes="16x16" />
                    <style>
                    html
                    {
                        box-sizing: border-box;
                        overflow: -moz-scrollbars-vertical;
                        overflow-y: scroll;
                    }

                    *,
                    *:before,
                    *:after
                    {
                        box-sizing: inherit;
                    }

                    body
                    {
                        margin:0;
                        background: #fafafa;
                    }
                    </style>
                </head>

                <body>
                    <div id="swagger-ui"></div>

                    <script src="/node_modules/swagger-ui-dist/swagger-ui-bundle.js"> </script>
                    <script src="/node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js"> </script>
                    <script>
                    window.onload = function() {
                        // Begin Swagger UI call region
                        const ui = SwaggerUIBundle({
                            url: '/swagger.json',
                            dom_id: '#swagger-ui',
                            deepLinking: true,
                            presets: [
                            SwaggerUIBundle.presets.apis,
                            SwaggerUIStandalonePreset
                            ],
                            plugins: [
                            SwaggerUIBundle.plugins.DownloadUrl
                            ],
                            layout: "StandaloneLayout"
                        })
                        // End Swagger UI call region

                        window.ui = ui
                    }
                </script>
                </body>
                </html>`;
