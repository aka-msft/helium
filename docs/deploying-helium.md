# Deploying a Helium Linux Container in Azure App Services for Containers

## Before Starting

Before getting started, make sure to have the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) installed on your machine. 

You should also have an active Azure subscription.

## Decide on an Application Prefix and Resource Group Prefix

Azure requires that certain resources have _unique_ names across Azure. In order to do that, it is neccessary to come up with a prefix to prepend to infrastructure item names. A good example of a unique prefix that may work would be your login alias or initials (if your alias was _mname_ for example, your container registry would be named _AAAheliumacr_). In the following documentation, where you see **{app_prefix}** you should replace that text with your application prefix.

## Installing Required Tools

- Install the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
- Install **jq**
  - Mac: _brew install jq_
  - Debian-based Linux: _sudo apt install jq_

## Setting up Azure Infrastructure

In order for the Helium demonstration to work, Azure infrastructure must first be deployed. The following list contains the ordered steps which need to be taken:

1. [Login to Azure](#login-to-azure)
2. [Create an Azure Service Principal](#create-an-azure-service-principal)
3. [Create the Resource Group](#create-the-resource-group)
4. [Create an Azure Container Registry](#create-an-azure-container-registry)
5. [Create your Application Service Plan](#create-your-application-service-plan)
6. [Create and Setup a CosmosDB](#create-and-setup-a-cosmosdb)
7. [Configure Application Insights for Application Monitoring](#configure-application-insights-for-application-monitoring)
8. [Create and Configure an Azure KeyVault](#create-and-configure-an-azure-keyvault)

### Login to Azure

Make sure that the Azure Command Line Interface (CLI) is properly logged in to your Azure account:

```bash
$ az login
Note, we have launched a browser for you to login. For old experience with device code, use "az login --use-device-code"
You have logged in. Now let us find all the subscriptions to which you have access...
[
  {
    "cloudName": "AzureCloud",
    "id": "zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz",
    "isDefault": false,
    "name": "Visual Studio Enterprise",
    "state": "Enabled",
    "tenantId": "zzzzzzzz-86f1-41af-zzzz-2d7cd011db47",
    "user": {
      "name": "zzzzzzz@microsoft.com",
      "type": "user"
    }
  }, ...
```
If you have multiple subscriptions, make sure that the active subscription is "default". We see that the subscription id here is not default (isDefault = false). Make this subscription the default one using the below command.

```bash
$ az account set --subscription "zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz"
```

You can check if this is the default subscription using the below command

```bash
$ az account list --output table
```

### Create an Azure Service Principal

You can generate an Azure Service Principal using the [`az ad sp create-for-rbac`](https://docs.microsoft.com/en-us/cli/azure/ad/sp?view=azure-cli-latest#az-ad-sp-create) command with `--skip-assignment` option. The `--skip-assignment` parameter limits any additional permissions from being assigned the default [`Contributor`](https://docs.microsoft.com/en-us/azure/role-based-access-control/rbac-and-directory-admin-roles#azure-rbac-roles) role in Azure subscription.

```bash
$ az ad sp create-for-rbac
{
  "appId": "50d65587-abcd-4619-1234-f99fb2ac0987",
  "displayName": "azure-cli-2019-01-23-20-27-37",
  "name": "http://azure-cli-2019-01-23-20-27-37",
  "password": "3ac38e00-aaaa-bbbb-bb87-7222bc4b1f11",
  "tenant": "72f988bf-86f1-41af-91ab-2d7cd011db47"
}
```

Make sure to keep a record of these key-value pairs, as they will be needed later

Note: You may receive an error if you do not have sufficient permissions on your Azure subscription to create a service principal.  If this happens, contact a subscription administrator to determine whether you have contributor-level access to the subscription.

There are some environments that that perform role assignments during the process of deployments.  In this case, the Service Principal requires Owner level access on the subscription.  Each environment where this is the case will document the requirements and whether or not there is a configuration option not requiring the Owner level privileges.

### Create the Resource Group

The first thing which needs to be done is to create a resource group for Azure to hold the Helium infrastructure. To create the resource group execute the following:

```bash
$ az group create -l eastus -n {app_prefix}helium
{
  "id": "/subscriptions/zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz/resourceGroups/{app_prefix}helium",
  "location": "eastus",
  "managedBy": null,
  "name": "{app_prefix}helium",
  "properties": {
    "provisioningState": "Succeeded"
  },
  "tags": null,
  "type": null
}
```

### Create an Azure Container Registry

The Azure Container Registry (ACR) is where Docker container images are stored. This infrastructure can be created in the following manner:

```bash
$ az acr create --name {app_prefix}heliumacr --resource-group {app_prefix}helium --sku Basic --admin-enabled true --location eastus
{
  "adminUserEnabled": true,
  "creationDate": "2019-04-17T17:48:03.872192+00:00",
  "id": "/subscriptions/zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz/resourceGroups/{app_prefix}helium/providers/Microsoft.ContainerRegistry/registries/{app_prefix}heliumacr",
  "location": "eastus",
  "loginServer": "{app_prefix}heliumacr.azurecr.io",
  "name": "{app_prefix}heliumacr",
  "networkRuleSet": null,
  "provisioningState": "Succeeded",
  "resourceGroup": "helium",
  "sku": {
    "name": "Basic",
    "tier": "Basic"
  },
  "status": null,
  "storageAccount": null,
  "tags": {},
  "type": "Microsoft.ContainerRegistry/registries"
}
```

In order for the Docker command line interface to be able to push the container image of Helium which will be built in a later step, the username and password must be obtained first from the ACR. The credentials can be obtained thusly:

```bash
$ az acr credential show --name {app_prefix}heliumacr
{
  "passwords": [
    {
      "name": "password",
      "value": "ZZZZZZZZfA5fMQeTqu0oizqAbPx1uZZZ"
    },
    {
      "name": "password2",
      "value": "ZZZmJcizOfkM/bZJZhw9PpPLZZZZZZZZ"
    }
  ],
  "username": "{app_prefix}heliumacr"
}
```

Make note of the _username_ and one of the two _password_s (either is fine) as they will be needed later.

### Create your Application Service Plan

In order to deploy a web application, an App Service Plan must first be created:

```bash
az appservice plan create --name {app_prefix}heliumapp --resource-group {app_prefix}helium --sku B1 --is-linux
{
  "freeOfferExpirationTime": "2019-05-17T17:50:45.863333",
  "geoRegion": "East US",
  "hostingEnvironmentProfile": null,
  "hyperV": false,
  "id": "/subscriptions/zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz/resourceGroups/{app_prefix}helium/providers/Microsoft.Web/serverfarms/{app_prefix}heliumapp",
  "isSpot": false,
  "isXenon": false,
  "kind": "linux", ...
```

### Create and Setup a CosmosDB

The Helium application will query a CosmosDB instance for data as part of its operation. As such, a database instance will need to be created:

```bash
$ az cosmosdb create --name {app_prefix}heliumcosmosdb --resource-group {app_prefix}helium
{
  "capabilities": [],
  "consistencyPolicy": {
    "defaultConsistencyLevel": "Session",
    "maxIntervalInSeconds": 5,
    "maxStalenessPrefix": 100
  }, ...
```

Next, follow the instructions importing the neccessary data into the CosmosDB instance: [https://github.com/4-co/imdb](https://github.com/4-co/imdb).

While logged-in to the [Azure Portal](https://portal.azure.com), examine your Cosmos DB instance - make note of your database's URL (it should look similar to: _https://{app_prefix}heliumcosmosdb.documents.azure.com:443/_). This will be needed in a later step.

### Configure Application Insights for Application Monitoring

We will use Azure Application Insights for application monitoring. First up, we must create the Application Insights instance to use. 

```bash
$ az resource create --resource-group {app_prefix}helium --resource-type "Microsoft.Insights/components" --name {app_prefix}_Insights --location "East US" --properties '{"Application_Type": "Node.JS", "Flow_Type": "Redfield", "Request_Source": "IbizaAIExtension"}'
```

Then, we retrieve the instrumentation key of this instance. 

```bash
$ az resource show -g "{app_prefix}helium" -n "{app_prefix}_Insights" --resource-type "Microsoft.Insights/components" --query properties.InstrumentationKey

"zz7522ec-32bd-4zfb-87df-1c20aa694azz"
```
Note down this instrumentation key ("zz7522ec-32bd-4zfb-87df-1c20aa694azz"). The instrumentation key will be used in the code to upload logs and metrics to the Application Insights instance.

### Create and Configure an Azure KeyVault

An Azure KeyVault is used to store secrets in a safe and secure manner, to create a KeyVault instance:

```bash 
$ az keyvault create --name {app_prefix}heliumkeyvault --resource-group {app_prefix}helium --location "eastus"
{
  "id": "/subscriptions/7060bca0-zzzz-zzzz-zzzz-4bb1e9facfac/resourceGroups/helium/providers/Microsoft.KeyVault/vaults/{app_prefix}heliumkeyvault",
  "location": "eastus",
  "name": "{app_prefix}heliumkeyvault",
  "properties": {
    "accessPolicies": [ ...
```

Now, add the CosmosDB access key as a KeyVault secret by executing the following commands:

```bash
$ keys=`az cosmosdb list-keys --name {app_prefix}heliumcosmosdb --resource-group {app_prefix}helium`
$ masterKey=`echo $keys | jq '.primaryMasterKey' | tr -d '"'`
$ az keyvault secret set --vault-name {app_prefix}heliumkeyvault --name "cosmosDBkey" --value "$masterKey"
{
  "attributes": {
    "created": "2019-04-23T16:13:24+00:00",
    "enabled": true,
    "expires": null,
    "notBefore": null,
    "recoveryLevel": "Purgeable",
    "updated": "2019-04-23T16:13:24+00:00" ...
```

Next, add the App Insights key as a KeyVault secret by executing the following command:

```bash
$ az keyvault secret set --vault-name {app_prefix}heliumkeyvault --name "AppInsightsInstrumentationKey" --value "{app insights key}"
{
  "attributes": {
    "created": "2019-04-23T16:13:24+00:00",
    "enabled": true,
    "expires": null,
    "notBefore": null,
    "recoveryLevel": "Purgeable",
    "updated": "2019-04-23T16:13:24+00:00" ...
```

Finally, create a new policy that allows the service principal to have KeyVault secret read access:

```bash
$ az keyvault set-policy --name {app_prefix}heliumkeyvault --secret-permissions get --spn {appId from the service principal}
{
  "id": "/subscriptions/zzzzzzzz-7a3c-zzzz-zzzz-4bb1e9facfac/resourceGroups/{app_prefix}helium/providers/Microsoft.KeyVault/vaults/{app_prefix}heliumkeyvault",
  "location": "eastus",
  "name": "{app_prefix}heliumkeyvault",
  "properties": {
    "accessPolicies": [

```

Login to the [Azure Portal](https://portal.azure.com), examine your KeyVault instance - make note of your KeyVaults's URL (it should look similar to: _https://{app_prefix}heliumkeyvault.vault.azure.net/_). This will also be needed in a later step.

## Building & Deploying

Now that all neccessary Azure infrastructure has been spun up, it is time to build and push the Helium Docker container image to the ACR. Once that has been completed it will finally be time to deploy the Helium web application.

1. [Build and Push Docker Image to ACR](#build-and-push-docker-image-to-acr)
2. [Deploy the Helium Container Image](#deploy-the-helium-container-image)
3. [Configure Dashboard with Azure Monitor Metrics](#configure-dashboard-with-azure-monitor-metrics)

### Build and Push Docker Image to ACR

It is finally time to build Helium and then push the container image to the Azure Container Registry (ACR) that was created earlier. 

1. Change the directory to the directory which containes the Helium repository.

2. Login the Docker CLI to your ACR:

```bash
$ az acr login --name {app_prefix}heliumacr
Login Succeeded
```

3. Build / Docker-ize Helium:

```bash
$ docker build --target=release -t {app_prefix}heliumacr.azurecr.io/helium:canary .
```

4. Push the Helium container image to the ACR:

```bash
$ docker push {app_prefix}heliumacr.azurecr.io/helium:canary
```

### Deploy the Helium Container Image

And finally, the last set of commands - deploying the web application from the container image! Deploying the Helium container image is as simple as executing the following commands:

1. Create the web application:

```bash
$ az webapp create --resource-group {app_prefix}helium --plan {app_prefix}heliumapp --name {prefix}helium --deployment-container-image-name {app_prefix}heliumacr.azurecr.io/helium:canary
{
  "availabilityState": "Normal",
  "clientAffinityEnabled": true,
  "clientCertEnabled": false,
  "clientCertExclusionPaths": null,
  "cloningInfo": null,
  "containerSize": 0,
  "dailyMemoryTimeQuota": 0,
  "defaultHostName": "{prefix}helium.azurewebsites.net" ...
```

2. Set environment variables (which configure Helium):

```bash
$ az webapp config appsettings set --resource-group {app_prefix}helium --name {prefix}helium --settings COSMOSDB_URL="{Cosmos DB URL}"
$ az webapp config appsettings set --resource-group {app_prefix}helium --name {prefix}helium --settings KEY_VAULT_URL="{KeyVault URL}"
$ az webapp config appsettings set --resource-group {app_prefix}helium --name {prefix}helium --settings TENANT_ID={service principal tenand id}
$ az webapp config appsettings set --resource-group {app_prefix}helium --name {prefix}helium --settings CLIENT_SECRET={service principal password}
$ az webapp config appsettings set --resource-group {app_prefix}helium --name {prefix}helium --settings CLIENT_ID={service principal appId}
```

3. Configuration via the Azure Portal is needed. Open the [Azure Portal](https://portal.azure.com) and perform the following actions:
  - Go to your resource group _{app_prefix}helium_
  - Go to your web application _{app_prefix}helium_
  - Go to **Container Settings**
  - Click on **Single Container**
  - Click on **Azure Container Registry**
  - In **Registry** enter _{app_prefix}heliumacr_
  - In **Image** enter _helium_
  - In **Tag** enter _canary_
  - Toggle **Continuous Deployment** to _on_ (if continuous deployment via webhooks is desired)
  - Click **Save**
  - Go to **Overview**
  - Click **Restart**

At this point, the web application has been completely deployed! It is now accessible at: **https://{prefix}helium.azurewebsites.net/api/movies**.

### Configure Dashboard with Azure Monitor Metrics

Now that Helium and its supporting infrastructure have been deployed, it's time to create a dashboard to display relevant metrics and logging data:

#### Creating the Dashboard and Tiles
 1. Open the [Azure Portal](https://portal.azure.com)
 2. Navigate to **Dashboard** on the left pane, and then create a new dashboard using the **+ New Dashboard** button
 3. Give the dashboard a name, for example: _Azure App Service dashboard_
 4. From the **Tile Gallery** on the left, add **Metrics chart** two times
 5. Add **Application Map - Application Insights** and **Search - Application Insights**
 6. For Cosmos DB monitoring, add two more **Metrics** charts
 7. Save the dashboard by clicking **Done customizing**


#### Populating the Tiles
1. Click **Configure tile** for Metric chart #1, next click **+ Select a resource**, then select your resource group from the drop down, and select **All resources** - from the list of resources, select the _Azure App service_ plan resource.
2. In the **Metric** drop down, select **CPU percentage**, then click **Update dashboard** on the right
3. Click **Configure tile** for Metric chart #2, repeat the steps as above but now select **Memory percentage** from the **Metric** drop down - click **Update dashboard** to update the configuration
4. Click **Configure tile** for **Application Map** tile, choose the subscription, resource group, and the name of the **Application Insights** instance which was created above
5. Repeat this for the **Search** tile as well and then connect it to the **Application Insights** instance created earlier
6. Click on the two Cosmos DB **Metrics** charts - similar to the above steps, select the resource group and then the cosmos DB resource from the metric dropdown select **Total requests** for one and then **Total Request units** for the other - update the dashboard
7. Now the dashboard contains metrics on CPU and memory usage for the Azure App Service Plan while also providing a way to search through custom logs from the application using the **Search - Application Insights** tile
