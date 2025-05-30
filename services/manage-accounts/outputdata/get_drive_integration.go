package outputdata

import (
	"mvp-2-spms/services/models"
)

type GetDriveIntegration struct {
	BaseGetIntegration
}

func MapToGetDriveIntegration(integr models.CloudDriveIntegration) GetDriveIntegration {
	return GetDriveIntegration{
		BaseGetIntegration: BaseGetIntegration{
			APIKey: integr.ApiKey,
			Type:   integr.Type,
		},
	}
}
