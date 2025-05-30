package interfaces

import (
	entities "mvp-2-spms/domain-aggregate"
	"mvp-2-spms/services/models"
)

type ICloudDrive interface {
	IIntegration
	AddProjectFolder(project entities.Project, driveInfo models.CloudDriveIntegration) (models.DriveProject, error)
	GetFolderNameById(id string) (string, error)
	AddProfessorBaseFolder() (models.DriveData, error)
	AddTaskToDrive(task entities.Task, projectFolderId string) (models.DriveTask, error)
	DeleteFolder(folderId string, driveInfo models.CloudDriveIntegration) error
}
