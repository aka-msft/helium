import { KeyVaultProvider } from "../secrets/keyvaultprovider";
import { CosmosDBProvider } from "../db/cosmosdbprovider";

/**
 * A service locator to avoid a refactor for dependency injection using InverisfyJS.
 * TODO: switch to InversifyJS for Restify to remove this code.
 */
export class ServiceLocator {

    private static _instance: ServiceLocator;

    private _keyvault: KeyVaultProvider;
    private _cosmostDB: CosmosDBProvider;

    /**
     * Private constructor to force initialization through getInstance
     */
    private constructor() {
    }

    /**
     * Returns an instance of the KeyVaultProvider
     */
    getKeyVault(): KeyVaultProvider {
        return ServiceLocator._instance._keyvault;
    }

    /**
     * Returns an instance of the CosmosDBProvider
     */
    getCosmosDB(): CosmosDBProvider {
        return ServiceLocator._instance._cosmostDB;
    }

    /**
     * Returns an instance of the ServiceLocator class
     */
    static async getInstance(): Promise<ServiceLocator> {

        if (ServiceLocator._instance == undefined) {
            let locator = new ServiceLocator();

            let clientId = process.env["CLIENT_ID"];
            let clientSecret = process.env["CLIENT_SECRET"];
            let tenantId = process.env["TENANT_ID"];

            let keyVaultUrl = process.env["KEY_VAULT_URL"];
            locator._keyvault = new KeyVaultProvider(keyVaultUrl, clientId, clientSecret, tenantId);

            let cosmosDbUrl = process.env["COSMOSDB_URL"];
            let cosmosDbKey = await locator._keyvault.getSecret("cosmosDBkey");

            let cosmosdb = new CosmosDBProvider(cosmosDbUrl, cosmosDbKey);
            locator._cosmostDB = cosmosdb;

            ServiceLocator._instance = locator;
        } 

        return ServiceLocator._instance;
    }

}