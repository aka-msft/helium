# Deploying a Helium Linux Container in Azure App Services for Docker

## Before Starting

Before getting started, make sure to have the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) installed on your machine. 

You should also have an active Azure subscription.

## Decide on an Application Prefix and Resource Group Prefix

If you have multiple people working off the same Azure subscription, decide on a prefix to make the resource group name unique. For instance, "ABC_Helium" would be a good resource group name where "ABC" is a unique prefix (your alias/initials would be a good one!). Throughout this documentation, where you see **{resource_group_name}** you should replace that with your unique resource group name

Azure requires that certain resources have _unique_ names across Azure. In order to do that, you'll need to come up with an application prefix. An example would be that if your team's initials were AAA, you would use that as your application prefix (for example, your container registry would be named _AAAheliumacr_). In the following documentation, where you see **{app prefix}** you should replace that text with your application prefix.

## Setting up Azure Infrastructure

In order for the Helium demonstration to work, Azure infrastructure must first be deployed. The following list contains the ordered steps which need to be taken:

1. Login to Azure
2. Create the Resource Group
3. Create an Azure Container Registry
4. Create your Application Service Plan
5. Configure Application Insights for application monitoring
6. Configure Azure Monitor for infrastructure monitoring
7. Create a Key Vault instance to store secrets
8. Populate secrets into Key Vault

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

### Create the Resource Group

The first thing which needs to be done is to create a resource group for Azure to hold the Helium infrastructure. To create the resource group execute the following:

```bash
$ az group create -l eastus -n {resource_group_name}
{
  "id": "/subscriptions/zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz/resourceGroups/{resource_group_name}",
  "location": "eastus",
  "managedBy": null,
  "name": "{resource_group_name}",
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
$ az acr create --name {app prefix}heliumacr --resource-group {resource_group_name} --sku Basic --admin-enabled true --location eastus
{
  "adminUserEnabled": true,
  "creationDate": "2019-04-17T17:48:03.872192+00:00",
  "id": "/subscriptions/zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz/resourceGroups/{resource_group_name}/providers/Microsoft.ContainerRegistry/registries/{app prefix}heliumacr",
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
az appservice plan create --name {app prefix}heliumapp --resource-group {resource_group_name} --sku B1 --is-linux
{
  "freeOfferExpirationTime": "2019-05-17T17:50:45.863333",
  "geoRegion": "East US",
  "hostingEnvironmentProfile": null,
  "hyperV": false,
  "id": "/subscriptions/zzz0bca0-7a3c-44bd-b54c-4bb1e9zzzzzz/resourceGroups/{resource_group_name}/providers/Microsoft.Web/serverfarms/{app prefix}heliumapp",
  "isSpot": false,
  "isXenon": false,
  "kind": "linux", ...
```

### Configure Application Insights for application monitoring

We will use Azure Application Insights for application monitoring. First up, we must create the Application Insights instance to use. 

```bash
$ az resource create --resource-group "{resource_group_name}" --resource-type "Microsoft.Insights/components" --name "{app prefix}_Insights" --location "East US" --properties '{"Application_Type": "Node.JS", "Flow_Type": "Redfield", "Request_Source": "IbizaAIExtension"}'
```

Then, we retrieve the instrumentation key of this instance. 

```bash
$ az resource show -g "{resource_group_name}" -n "{app prefix}_Insights" --resource-type "Microsoft.Insights/components" --query properties.InstrumentationKey

"zz7522ec-32bd-4zfb-87df-1c20aa694azz"
```
Note down this instrumentation key ("zz7522ec-32bd-4zfb-87df-1c20aa694azz"). The instrumentation key will be used in the code to upload logs and metrics to the Application Insights instance.

### Create a Key Vault instance to store secrets

We will create an Azure Key Vault instance to store secrets like the cosmos db connection string, Application Insights instrumentation key etc.

Follow instructions here to create a Key Vault instance
https://docs.microsoft.com/en-us/azure/key-vault/key-vault-manage-with-cli2#how-to-create-a-hardened-container-a-vault-in-azure

```bash
$ az keyvault create --name "{unique_keyvault_name}" --resource-group "{resource_group_name}" --location "East US"
```

### Populate secrets into Key Vault

TODO: [Ercorson] Need to add app insights instrumentation key from above step to the above created key vault instance

TODO: [SeUsher] Need to add cosmos db connection info also to key vault possibly 

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

### Configure dashboard with Azure Monitor metrics for infrastructure monitoring

Now, that we have the app deployed and all the infrastructure deployed, we can create a metrics dashboard that lists metrics and logs relevant to your app in one place. For this, we will go into the Azure Portal.

## Creating the dashboard and tiles
 - Open Azure Portal - http://portal.azure.com. Login with your credentials.
 - Navigate to "Dashboard" on the left pane. Create a new dashboard using the "+ New Dashboard" button.
 - Give your dashboard a name say "Azure App Service dashboard". From the 'Tile Gallery' on the left, Add 'Metrics chart' two times
 - Also add 'Application Map - Application Insights' and 'Search - Application Insights'
 - For Cosmos DB monitoring, add two more 'Metrics' charts
 - Save the dashboard by clicking on "Done customizing"


## Populating the tiles
- Click on 'Configure tile' for Metric chart #1. Click on '+ Select a resource'. Select your resource group from the drop down, and select 'All resources'. From the list of resources, select the Azure App service plan resource.
- In the 'Metric' drop down, select 'CPU percentage'. Click on 'Update dashboard' on the right.
- Click on 'Configure tile' for Metric chart #2. Repeat the steps as above but now select 'Memory percentage' from the 'Metric' drop down. Click on 'Update dashboard' to update it.
- Click on 'Configure tile' for 'Application Map' tile. Choose your subscription, resource group and then the name of the 'Application Insights' instance we created above.
- Repeat this for the 'Search' tile too and connect it to the 'Application Insights' instance we created.
- Click on the two Cosmos DB 'Metrics' charts. Similar to the above steps select the resource group and the cosmos DB resource. From the metric dropdown select 'Total requests' for one and 'Total Request units' for another. Update the dashboard.
- Now your dashboard has the metrics on CPU and memory usage of the Azure App service plan and also provides you a way to search through the custom logs from your app using the 'Search - Application Insights' tile.