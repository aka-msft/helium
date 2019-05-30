package test

import (
	"fmt"
	"os"
	"testing"

	"github.com/gruntwork-io/terratest/modules/random"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/microsoft/cobalt/test-harness/infratests"
)

var prefix = fmt.Sprintf("cobalt-unit-tst-%s", random.UniqueId())
var datacenter = os.Getenv("DATACENTER_LOCATION")

var tf_options = &terraform.Options{
	TerraformDir: "../../",
	Upgrade:      true,
	Vars: map[string]interface{}{
		"prefix":   prefix,
		"location": datacenter,
	},
	BackendConfig: map[string]interface{}{
		"storage_account_name": os.Getenv("TF_VAR_remote_state_account"),
		"container_name":       os.Getenv("TF_VAR_remote_state_container"),
	},
}

func TestAzureSimple(t *testing.T) {
	testFixture := infratests.UnitTestFixture{
		GoTest:                t,
		TfOptions:             tf_options,
		ExpectedResourceCount: 3,
		PlanAssertions:        nil,
		ExpectedResourceAttributeValues: infratests.ResourceDescription{
			"azurerm_app_service.main": infratests.AttributeValueMapping{
				"resource_group_name":            prefix,
				"location":                       datacenter,
				"site_config.0.linux_fx_version": "DOCKER|appsvcsample/static-site:latest",
			},
			"azurerm_app_service_plan.main": infratests.AttributeValueMapping{
				"kind":       "Linux",
				"location":   datacenter,
				"reserved":   "true",
				"sku.0.size": "S1",
				"sku.0.tier": "Standard",
			},
			"azurerm_resource_group.main": infratests.AttributeValueMapping{
				"location": datacenter,
				"name":     prefix,
			},
		},
	}

	infratests.RunUnitTests(&testFixture)
}
