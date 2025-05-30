package inputdata

import (
	"fmt"
	entities "mvp-2-spms/domain-aggregate"
	"time"
)

type GetProjectTasks struct {
	ProfessorId uint
	ProjectId   uint
}

type AddTask struct {
	ProfessorId uint
	ProjectId   uint
	Name        string
	Description string
	Deadline    time.Time
}

type UpdateTask struct {
	Id          int
	ProfId      int
	Name        *string    `json:"name,omitempty"`
	Description *string    `json:"description,omitempty"`
	Deadline    *time.Time `json:"deadline,omitempty"`
	Status      *int       `json:"status,omitempty"`
}

func (at UpdateTask) UpdateTaskEntity(task *entities.Task) error {
	task.Id = fmt.Sprint(at.Id)
	if at.Deadline != nil {
		task.Deadline = *at.Deadline
	}
	if at.Description != nil {
		task.Description = *at.Description
	}
	if at.Name != nil {
		task.Name = *at.Name
	}
	if at.Status != nil {
		task.Status = entities.TaskStatus(*at.Status)
	}
	return nil
}

func (at AddTask) MapToTaskEntity() entities.Task {
	return entities.Task{
		ProjectId:   fmt.Sprint(at.ProjectId),
		Name:        at.Name,
		Description: at.Description,
		Deadline:    at.Deadline,
		Status:      entities.NotStarted,
	}
}
