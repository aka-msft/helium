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

            const clientId = process.env.CLIENT_ID;
            const clientSecret = process.env.CLIENT_SECRET;
            const tenantId = process.env.TENANT_ID;

            const keyVaultUrl = process.env.KEY_VAULT_URL;
            locator.keyvault = new KeyVaultProvider(keyVaultUrl, clientId, clientSecret, tenantId);

            // DB Service
            const cosmosDbUrl = process.env.COSMOSDB_URL;
            const cosmosDbKey = await locator.keyvault.getSecret("cosmosDBkey");

            const cosmosdb = new CosmosDBProvider(cosmosDbUrl, cosmosDbKey);
            locator.cosmosDB = cosmosdb;

            // App Insights Service
            const insightsInstrumentationKey = await locator.keyvault.getSecret("AppInsightsInstrumentationKey");
            const telemClient = new AppInsightsProvider(insightsInstrumentationKey);
            locator.telemClient = telemClient;

            ServiceLocator.instance = locator;
        }

        return ServiceLocator.instance;
    }

    private static instance: ServiceLocator;

    private keyvault: KeyVaultProvider;
    private cosmosDB: CosmosDBProvider;
    private telemClient: AppInsightsProvider;

    /**
     * Private constructor to force initialization through getInstance
     */
    private constructor() {
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
