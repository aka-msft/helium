import * as bodyParser from "body-parser";
import { Container } from "inversify";
import { interfaces, InversifyRestifyServer, TYPE } from "inversify-restify-utils";
import "reflect-metadata";
import * as restify from "restify";
import { ActorController } from "./app/controllers/actor";
import { GenreController } from "./app/controllers/genre";
import { MovieController } from "./app/controllers/movie";
import { SystemController } from "./app/controllers/system";
import { CosmosDBProvider } from "./db/cosmosdbprovider";
import { IDatabaseProvider } from "./db/idatabaseprovider";
import { BunyanLogger } from "./logging/bunyanLogProvider";
import { ILoggingProvider } from "./logging/iLoggingProvider";
import { KeyVaultProvider } from "./secrets/keyvaultprovider";
import { ITelemProvider } from "./telem/itelemprovider";
import { AppInsightsProvider } from "./telem/telemProvider";

(async () => {

    const config = await getConfigValues();

    const iocContainer = new Container();

    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(ActorController).whenTargetNamed("ActorController");
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(GenreController).whenTargetNamed("GenreController");
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(MovieController).whenTargetNamed("MovieController");
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(SystemController).whenTargetNamed("SystemController");
    iocContainer.bind<IDatabaseProvider>("IDatabaseProvider").to(CosmosDBProvider).inSingletonScope();
    iocContainer.bind<string>("string").toConstantValue(config.cosmosDbUrl).whenTargetNamed("cosmosDbUrl");
    iocContainer.bind<string>("string").toConstantValue(config.cosmosDbKey).whenTargetNamed("cosmosDbKey");
    iocContainer.bind<ITelemProvider>("ITelemProvider").to(AppInsightsProvider).inSingletonScope();
    iocContainer.bind<ILoggingProvider>("ILoggingProvider").to(BunyanLogger).inSingletonScope();
    iocContainer.bind<string>("string").toConstantValue(config.insightsKey).whenTargetNamed("instrumentationKey");

    const port = process.env.PORT || 3000;

    // create restify server
    const server = new InversifyRestifyServer(iocContainer);
    const telem = iocContainer.get<ITelemProvider>("ITelemProvider");
    const log = iocContainer.get<ILoggingProvider>("ILoggingProvider");
    telem.trackEvent("server start");
    // listen for requests
    telem.trackEvent("Listening for requests");
    server.setConfig((app) => {
        // parse requests of content-type - application/x-www-form-urlencoded
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(restify.plugins.queryParser({ mapParams: false }));
        app.use(bodyParser.json());
        // define a simple route
        app.get("/", (req, res) => {
            res.json({ message: "Welcome to the MovieInfo reference application." });
        });
    }).build().listen(port, () => {
        console.log("Server is listening on port " + port);
    });
})();

export async function getConfigValues(): Promise<{cosmosDbKey: string, cosmosDbUrl: string, insightsKey: string}> {

    // cosmosDbKey comes from KeyVault or env var
    let cosmosDbKey: string;
    // insightsKey comes from KeyVault or env var
    let insightsKey: string;

    let configFallback: boolean;

    // try to get KeyVault connection details from env
    const clientId = process.env.CLIENT_ID;
    if (!clientId) {
        console.log("No CLIENT_ID env var set");
        configFallback = true;
    }

    const clientSecret = process.env.CLIENT_SECRET;
    if (!clientSecret) {
        console.log("No CLIENT_SECRET env var set");
        configFallback = true;
    }

    const tenantId = process.env.TENANT_ID;
    if (!tenantId) {
        console.log("No TENANT_ID env var set");
        configFallback = true;
    }

    const cosmosDbUrl = process.env.COSMOSDB_URL;
    if (!cosmosDbUrl) {
        console.log("No COSMOSDB_URL env var set");
        process.exit(1);
    }

    // first try KeyVault, then env var
    if (!configFallback) {
        const keyVaultUrl = process.env.KEY_VAULT_URL;
        const keyvault = new KeyVaultProvider(keyVaultUrl, clientId, clientSecret, tenantId);

        cosmosDbKey = await keyvault.getSecret("cosmosDBkey");
        insightsKey = await keyvault.getSecret("AppInsightsInstrumentationKey");

    } else {
        console.log("Unable to use KeyVault, falling back to env vars for secrets");
    }

    // if some secrets still don't exist, check env
    if (!cosmosDbKey) {
        cosmosDbKey = process.env.COSMOSDB_KEY;
    }
    if (!insightsKey) {
        insightsKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
    }

    // exit with failing code if still no secrets
    if (!cosmosDbKey) {
        console.log("Failed to get COSMOSDB_KEY");
        process.exit(1);
    }
    if (!insightsKey) {
        console.log("Failed to get APPINSIGHTS_INSTRUMENTATIONKEY");
        process.exit(1);
    }

    return {
        cosmosDbKey,
        cosmosDbUrl,
        insightsKey,
    };
}
