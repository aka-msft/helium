import { CosmosDBProvider } from "../db/cosmosdbprovider";
import { KeyVaultProvider } from "../secrets/keyvaultprovider";

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

            const cosmosDbUrl = process.env.COSMOSDB_URL;
            const cosmosDbKey = await locator.keyvault.getSecret("cosmosDBkey");

            const cosmosdb = new CosmosDBProvider(cosmosDbUrl, cosmosDbKey);
            locator.cosmosDB = cosmosdb;

            ServiceLocator.instance = locator;
        }

        return ServiceLocator.instance;
    }

    private static instance: ServiceLocator;

    private keyvault: KeyVaultProvider;
    private cosmosDB: CosmosDBProvider;

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
}
