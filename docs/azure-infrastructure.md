# Deploying a Helium Linux Container in Azure App Services for Docker

## Before Starting

Before getting started, make sure to have the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) installed on your machine. 

## Decide on an Application Prefix

Azure requires that certain resources have _unique_ names across Azure. In order to do that, you'll need to come up with an application prefix. An example would be that if your team's initials were AAA, you would use that as your application prefix (for example, your container registry would be named _AAAheliumacr_). In the following documentation, where you see **{app prefix}** you should replace that text with your application prefix.

## Setting up Azure Infrastructure

In order for the Helium demonstration to work, Azure infrastructure must first be deployed. The following list contains the ordered steps which need to be taken:

1. Login to Azure
2. Create the Resource Group
3. Create an Azure Container Registry
4. Create your Application Service Plan
5. Configure Telemetry

### Login to Azure

Make sure that the Azure Command Line Interface (CLI) is properly logged in to your Azure account:

```bash
$ az login
Note, we have launched a browser for you to login. For old experience with device code, use "az login --use-device-code"
You have logged in. Now let us find all the subscriptions to which you have access...
[
  {
    "cloudName": "AzureCloud",
    "id": "zzzzzzzz-da9b-43f3-zzzz-019a82bcaf30",
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

### Create the Resource Group

The first thing which needs to be done is to create a resource group for Azure to hold the Helium infrastructure. To create the resource group execute the following:

```bash
$ az group create -l eastus -n helium
{
  "id": "/subscriptions/zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz/resourceGroups/helium",
  "location": "eastus",
  "managedBy": null,
  "name": "helium",
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
$ az acr create --name {app prefix}heliumacr --resource-group helium --sku Basic --admin-enabled true --location eastus
{
  "adminUserEnabled": true,
  "creationDate": "2019-04-17T17:48:03.872192+00:00",
  "id": "/subscriptions/zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz/resourceGroups/helium/providers/Microsoft.ContainerRegistry/registries/{app prefix}heliumacr",
  "location": "eastus",
  "loginServer": "{app prefix}heliumacr.azurecr.io",
  "name": "{app prefix}heliumacr",
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
$ az acr credential show --name {app prefix}heliumacr
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
  "username": "{app prefix}heliumacr"
}
```

Make note of the _username_ and one of the two _password_s (either is fine) as they will be needed later.

### Create the Application Service Plan

In order to deploy a web application, an App Service Plan must first be created:

```bash
az appservice plan create --name {app prefix}heliumapp --resource-group helium --sku B1 --is-linux
{
  "freeOfferExpirationTime": "2019-05-17T17:50:45.863333",
  "geoRegion": "East US",
  "hostingEnvironmentProfile": null,
  "hyperV": false,
  "id": "/subscriptions/zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz/resourceGroups/helium/providers/Microsoft.Web/serverfarms/{app prefix}heliumapp",
  "isSpot": false,
  "isXenon": false,
  "kind": "linux", ...
```

### Configure Telemetry

**TODO: telemetry instructions - work w/ Janani on this**

## Building & Deploying

Now that all neccessary Azure infrastructure has been spun up, it is time to build and push the Helium Docker container image to the ACR. Once that has been completed it will finally be time to deploy the Helium web application.

### Build and Push Docker Image to ACR

**TODO: finish the build / push instructions**

### Deploy the Helium Container Image

And finally, the last step - deploying the web application from the container image! Deploying the Helium container image is as simple as executing the following command:

```bash
$ az webapp create --resource-group helium --plan {app prefix}heliumapp --name {prefix}helium --deployment-container-image-name {your ACR repo name}/helium
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

If you received output similar to above, at this point your web application has been completely created! It is now accessible at: **{prefix}helium.azurewebsites.net**.