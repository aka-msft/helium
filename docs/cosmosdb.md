# Setting Up and Using CosmosDB

## Create and Setup CosmosDB
 Follow the instructions for importing data into your CosmosDB instance: [https://github.com/4-co/imdb](https://github.com/4-co/imdb)

## Create an Azure KeyVault
```bash 
az keyvault create --name "heliumkeyvault" --resource-group "helium" --location "eastus"
```

## Add the CosmosDB Access Key as a KeyVault Secret
```bash
keys=`az cosmosdb list-keys --name heliumcosmosdb --resource-group helium`
masterKey=`echo $keys | jq '.primaryMasterKey' | tr -d '"'`
az keyvault secret set --vault-name "heliumkeyvault" --name "cosmosDBkey" --value "$masterKey"
```

## Create a new App Registration with KeyVault Secret Read Access

```bash
az keyvault set-policy --name heliumkeyvault --secret-permissions get --spn <app id>
```

## Generate a Password for the Sevice Principal
Using the Azure Portal, generate a new Key for your registered app.

## Set Environment Variables
Before running the application, you will need to set the following environment variables.
```bash
export CLIENT_ID=<app id>
export CLIENT_SECRET=<app key>
export TENANT_ID=<Azure tenant id>
export KEY_VAULT_URL=`az keyvault show --name heliumkeyvault | jq '.properties.vaultUri' | tr -d '"'`
export COSMOSDB_URL=`az cosmosdb show --name heliumcosmosdb --resource-group helium | jq '.documentEndpoint' | tr -d '"'`
```