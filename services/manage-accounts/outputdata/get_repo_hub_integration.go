package outputdata

import (
	"mvp-2-spms/services/models"
)

type GetRepoHubIntegration struct {
	BaseGetIntegration
}

func MapToGetRepoHubIntegration(integr models.BaseIntegration) GetRepoHubIntegration {
	return GetRepoHubIntegration{
		BaseGetIntegration: BaseGetIntegration{
			APIKey: integr.ApiKey,
			Type:   integr.Type,
		},
	}
}
