package outputdata

type GetAccountIntegrations struct {
	CloudDrive *GetAccountIntegrationsDrive   `json:"cloud_drive,omitempty"`
	Planner    *GetAccountIntegrationsPlanner `json:"planner,omitempty"`
	RepoHubs   []GetAccountIntegrationsIntegr `json:"repo_hubs"`
}

func MapToGetAccountIntegrations(cdi *GetAccountIntegrationsDrive, pi *GetAccountIntegrationsPlanner, rhis []GetAccountIntegrationsIntegr) GetAccountIntegrations {
	result := GetAccountIntegrations{
		RepoHubs: []GetAccountIntegrationsIntegr{},
	}
	if cdi != nil {
		result.CloudDrive = cdi
	}
	if pi != nil {
		result.Planner = pi
	}
	result.RepoHubs = append(result.RepoHubs, rhis...)
	return result
}

type GetAccountIntegrationsIntegr struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type GetAccountIntegrationsDrive struct {
	Type           GetAccountIntegrationsIntegr `json:"type"`
	BaseFolderId   string                       `json:"base_folder_id,omitempty"`
	BaseFolderName string                       `json:"base_folder_name,omitempty"`
}

type GetAccountIntegrationsPlanner struct {
	Type        GetAccountIntegrationsIntegr `json:"type"`
	PlannerName string                       `json:"planner_name,omitempty"`
}
