import * as msrestazure from "ms-rest-azure";
import * as keyvault from "azure-keyvault";

/**
 * Handles accessing secrets from Azure Key vault.
 */
export class KeyVaultProvider {
    private _client: keyvault.KeyVaultClient;

    private _url: string;
    private _clientId: string;
    private _clientSecret: string
    private _tenantId: string

    /**
     * Creates a new instance of the KeyVaultProvider class.
     * @param url The KeyVault URL
     * @param clientId The service principal client id that has 'secret read' access.
     * @param clientSecret The password for the provided service principal.
     * @param tenantId The id of the tenant that the service principal is a member of.
     */
    constructor(url: string, clientId: string, clientSecret: string, tenantId: string) {
        this._url = url;
        this._clientId = clientId;
        this._clientSecret = clientSecret;
        this._tenantId = tenantId;
    }

    /**
     * Returns the latest version of the names secret.
     * @param name The name of the secret.
     */
    async getSecret(name: string): Promise<string> {

        if (this._client == null) {
            await this._initialize();
        }
  
        // An empty string for 'secretVersion' returns the latest version
        let secret = await this._client.getSecret(this._url, name, "")
            .then(secret => { return <string>(secret.value); })
            .catch(_ => {
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
        let creds = this._clientId == undefined || this._clientId == "" ? 
                    await msrestazure.loginWithMSI(): 
                    await msrestazure.loginWithServicePrincipalSecret(this._clientId, this._clientSecret, this._tenantId);

        this._client = new keyvault.KeyVaultClient(creds);
    }
}