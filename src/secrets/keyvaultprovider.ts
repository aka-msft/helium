import * as keyvault from "azure-keyvault";
import * as msrestazure from "ms-rest-azure";

/**
 * Handles accessing secrets from Azure Key vault.
 */
export class KeyVaultProvider {
    private client: keyvault.KeyVaultClient;

    /**
     * Creates a new instance of the KeyVaultProvider class.
     * @param url The KeyVault URL
     * @param clientId The service principal client id that has 'secret read' access.
     * @param clientSecret The password for the provided service principal.
     * @param tenantId The id of the tenant that the service principal is a member of.
     */
    constructor(private url: string, private clientId: string, private clientSecret: string, private tenantId: string) {
        this.url = url;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tenantId = tenantId;
    }

    /**
     * Returns the latest version of the names secret.
     * @param name The name of the secret.
     */
    public async getSecret(name: string): Promise<string> {

        if (this.client == null) {
            await this._initialize();
        }

        // An empty string for 'secretVersion' returns the latest version
        const secret = await this.client.getSecret(this.url, name, "")
            .then((s) =>  (s.value) as string)
            .catch((_) => {
                throw new Error(`Unable to find secret ${name}`);
            });

        return secret;
    }

    /**
     * Initialized the KeyVault client.
     * This is handled in a separate method to avoid calling async operations in the constructor.
     */
    private async _initialize() {

        // TODO (seusher): Validate MSI works with App Service containers
        const creds = this.clientId === undefined || this.clientId === "" ?
                    await msrestazure.loginWithAppServiceMSI({resource: "https://vault.azure.net"}) :
                    await msrestazure.loginWithServicePrincipalSecret(this.clientId, this.clientSecret, this.tenantId);

        this.client = new keyvault.KeyVaultClient(creds);
    }
}
