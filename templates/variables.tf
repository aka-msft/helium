variable "resource_group_name" {
  description = "The name of the resource group in which the resources will be created."
  type        = "string"
}

variable "resource_group_location" {
  description = "The deployment location of resource group container all the resources"
  default     = "eastus"
}

variable "service_plan_name" {
  description = "The name of the service plan to be deployed."
  type        = "string"
}

variable "appinsights_name" {
  description = "Name of the App Insights to create"
  type        = "string"
}

variable "appinsights_application_type" {
  description = "Type of the App Insights Application"
  type        = "string"
  default     = "Node.JS"
}

variable "resource_tags" {
  description = "Map of tags to apply to taggable resources in this module.  By default the taggable resources are tagged with the name defined above and this map is merged in"
  type        = "map"
  default     = {}
}

variable "cosmosdb_name" {
  description = "The name that CosmosDB will be created with."
  type        = "string"
}

variable "cosmosdb_kind" {
  description = "Determines the kind of CosmosDB to create. Can either be 'GlobalDocumentDB' or 'MongoDB'."
  type        = "string"
  default     = "GlobalDocumentDB"
}

variable "cosmosdb_automatic_failover" {
  description = "Determines if automatic failover is enabled for the created CosmosDB."
  default     = false
}

variable "consistency_level" {
  description = "The Consistency Level to use for this CosmosDB Account. Can be either 'BoundedStaleness', 'Eventual', 'Session', 'Strong' or 'ConsistentPrefix'."
  type        = "string"
  default     = "Session"
}

variable "primary_replica_location" {
  description = "The name of the Azure region to host replicated data."
  type        = "string"
}
