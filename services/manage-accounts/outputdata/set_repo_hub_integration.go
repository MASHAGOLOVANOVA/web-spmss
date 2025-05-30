package outputdata

import (
	"time"
)

type SetRepoHubIntegration struct {
	AccessToken string
	Expiry      time.Time
}

// func MapToSetPlannerIntegration(integr models.PlannerIntegration) SetPlannerIntegration {
// 	return SetPlannerIntegration{
// 		BaseGetIntegration: BaseGetIntegration{
// 			APIKey: integr.ApiKey,
// 			Type:   integr.Type,
// 		},
// 	}
// }
