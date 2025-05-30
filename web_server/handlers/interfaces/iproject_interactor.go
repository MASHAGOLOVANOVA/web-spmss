package interfaces

import (
	"mvp-2-spms/services/interfaces"
	"mvp-2-spms/services/manage-projects/inputdata"
	"mvp-2-spms/services/manage-projects/outputdata"
)

type IProjetInteractor interface {
	GetProfessorProjects(input inputdata.GetProfessorProjects) (outputdata.GetProfessorProjects, error)
	GetProjectCommits(input inputdata.GetProjectCommits, gitRepositoryHub interfaces.IGitRepositoryHub) (outputdata.GetProjectCommits, error)
	GetProjectById(input inputdata.GetProjectById) (outputdata.GetProjectById, error)
	AddProject(input inputdata.AddProject, cloudDrive interfaces.ICloudDrive) (outputdata.AddProject, error)
	UpdateProject(input inputdata.UpdateProject, cloudDrive interfaces.ICloudDrive) error
	DeleteProject(profId uint, projectId uint64, cloudDrive interfaces.ICloudDrive) error
	UpdateProjectGrading(input inputdata.UpdateProjectGrading) error
	GetProjectStatsById(input inputdata.GetProjectStatsById) (outputdata.GetProjectStatsById, error)
	GetProjectSupReport(input inputdata.GetProjectSupReport) (string, error)
}
