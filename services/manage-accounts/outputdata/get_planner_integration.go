package outputdata

import (
	"mvp-2-spms/services/models"
)

type GetPlannerIntegration struct {
	BaseGetIntegration
}

func MapToGetPlannerIntegration(integr models.PlannerIntegration) GetPlannerIntegration {
	return GetPlannerIntegration{
		BaseGetIntegration: BaseGetIntegration{
			APIKey: integr.ApiKey,
			Type:   integr.Type,
		},
	}
}
