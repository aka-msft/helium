import { ILoggingProvider } from "../logging/iLoggingProvider";
import { KeyVaultProvider } from "../secrets/keyvaultprovider";

// Gets configuration details needed to connect to KeyVault, CosmosDB, and AppInsights.
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
