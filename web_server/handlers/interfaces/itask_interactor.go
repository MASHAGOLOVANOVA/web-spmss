package interfaces

import (
	"mvp-2-spms/services/interfaces"
	"mvp-2-spms/services/manage-tasks/inputdata"
	"mvp-2-spms/services/manage-tasks/outputdata"
)

type ITaskInteractor interface {
	AddTask(input inputdata.AddTask, cloudDrive interfaces.ICloudDrive) (outputdata.AddTask, error)
	GetProjectTasks(input inputdata.GetProjectTasks) (outputdata.GetProjectTasks, error)
	UpdateTask(input inputdata.UpdateTask, cloudDrive interfaces.ICloudDrive) error
}
