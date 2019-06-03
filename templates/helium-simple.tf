resource "azurerm_resource_group" "helium_resource" {
    name     = "${var.resource_group_name}"
    location = "${var.resource_group_location}"
}

module "service_plan" {
  source                  = "github.com/microsoft/cobalt/infra/modules/providers/azure/service-plan"
  resource_group_name     = "${azurerm_resource_group.helium_resource.name}"
  service_plan_name       = "${var.service_plan_name}"
}

module "app_insights" {
  source                               = "github.com/microsoft/cobalt/infra/modules/providers/azure/app-insights"
  service_plan_resource_group_name     = "${azurerm_resource_group.helium_resource.name}"
  appinsights_name                     = "${var.appinsights_name}"
  appinsights_application_type         = "${var.appinsights_application_type}"
  resource_tags                        = "${var.resource_tags}"
}

module "cosmosdb" {
    source                             = "github.com/microsoft/cobalt/infra/modules/providers/azure/cosmosdb"
    service_plan_resource_group_name   = "${azurerm_resource_group.helium_resource.name}"
    cosmosdb_name                      = "${var.cosmosdb_name}"
    cosmosdb_kind                      = "${var.cosmosdb_kind}"
    cosmosdb_automatic_failover        = "${var.cosmosdb_automatic_failover}"
    consistency_level                  = "${var.consistency_level}"
    primary_replica_location           = "${var.primary_replica_location}"
}