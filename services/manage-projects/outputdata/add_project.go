package outputdata

import (
	entities "mvp-2-spms/domain-aggregate"
	"strconv"
)

type AddProject struct {
	Id int `json:"project_id"`
}

func MapToAddProject(project entities.Project) AddProject {
	sId, _ := strconv.Atoi(project.Id)
	return AddProject{
		Id: sId,
	}
}
