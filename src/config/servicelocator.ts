import { CosmosDBProvider } from "../db/cosmosdbprovider";
import { KeyVaultProvider } from "../secrets/keyvaultprovider";
import { AppInsightsProvider } from "../telem/telemProvider";

/**
 * A service locator to avoid a refactor for dependency injection using InverisfyJS.
 * TODO: switch to InversifyJS for Restify to remove this code.
 */
export class ServiceLocator {

    /**
     * Returns an instance of the ServiceLocator class
     */
    public static async getInstance(): Promise<ServiceLocator> {

        if (ServiceLocator.instance === undefined) {
            const locator = new ServiceLocator();

            // handle config validation
            await locator.getConfig();

            // instantiate the clients
            locator.cosmosDB = new CosmosDBProvider(locator.cosmosDbURL, locator.cosmosDbKey);
            locator.telemClient = new AppInsightsProvider(locator.appInsightsKey);

            ServiceLocator.instance = locator;
        }

        return ServiceLocator.instance;
    }

    private static instance: ServiceLocator;

    public cosmosDbURL: string;
    public cosmosDbKey: string;
    public appInsightsKey: string;

    private keyvault: KeyVaultProvider;
    private cosmosDB: CosmosDBProvider;
    private telemClient: AppInsightsProvider;

    /**
     * Private constructor to force initialization through getInstance
     */
    private constructor() {
    }

    /**
     * Validate and set config variables
     */
    public async getConfig() {
        // track whether a fallback to env vars for secrets is necessary
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
        this.cosmosDbURL = cosmosDbUrl;

        // cosmosDbKey comes from KeyVault or env var
        let cosmosDbKey: string;
        // insightsKey comes from KeyVault or env var
        let insightsKey: string;

        // first try KeyVault, then env var
        if (!configFallback) {
            const keyVaultUrl = process.env.KEY_VAULT_URL;
            this.keyvault = new KeyVaultProvider(keyVaultUrl, clientId, clientSecret, tenantId);

            cosmosDbKey = await this.keyvault.getSecret("cosmosDBkey");
            insightsKey = await this.keyvault.getSecret("AppInsightsInstrumentationKey");

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

        this.cosmosDbKey = cosmosDbKey;
        this.appInsightsKey = insightsKey;
    }

    /**
     * Returns an instance of the KeyVaultProvider
     */
    public getKeyVault(): KeyVaultProvider {
        return ServiceLocator.instance.keyvault;
    }

    /**
     * Returns an instance of the CosmosDBProvider
     */
    public getCosmosDB(): CosmosDBProvider {
        return ServiceLocator.instance.cosmosDB;
    }

    /**
     * Returns an instance of the AppInsightsProvider
     */
    public getTelemClient(): AppInsightsProvider {
        return ServiceLocator.instance.telemClient;
    }
}
