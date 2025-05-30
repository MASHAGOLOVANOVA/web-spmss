package outputdata

import (
	"mvp-2-spms/services/models"
	"strconv"
	"time"
)

type GetProjectTasks struct {
	Tasks []getProjectTasksData `json:"tasks"`
}

func MapToGetProjectTasks(tasks []models.DriveTask) GetProjectTasks {
	outputProjects := []getProjectTasksData{}
	for _, task := range tasks {
		id, _ := strconv.Atoi(task.Task.Id)
		outputProjects = append(outputProjects,
			getProjectTasksData{
				Id:              id,
				Name:            task.Name,
				Description:     task.Description,
				Deadline:        task.Deadline,
				Status:          task.Status.String(),
				CloudFolderLink: task.DriveFolder.Link,
			})
	}
	return GetProjectTasks{
		Tasks: outputProjects,
	}
}

type getProjectTasksData struct {
	Id              int       `json:"id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	Deadline        time.Time `json:"deadline"`
	Status          string    `json:"status"`
	CloudFolderLink string    `json:"cloud_folder_link"`
}
