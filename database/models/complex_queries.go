package models

import (
	entities "mvp-2-spms/domain-aggregate"
	"mvp-2-spms/services/models"
)

type ProjectTaskInfo struct {
	Statuses []statusCount
}

type statusCount struct {
	Status int `gorm:"column:status"`
	Count  int `gorm:"column:count"`
}

func (pti *ProjectTaskInfo) MapToUseCaseModel() models.TasksInfo {
	result := models.TasksInfo{}
	for _, s := range pti.Statuses {
		switch entities.TaskStatus(s.Status) {
		case entities.NotStarted:
			result.NotStartedCount = s.Count

		case entities.InProgress:
			result.InProgressCount = s.Count

		case entities.FinishedOnTime:
			result.FinishedOnTimeCount = s.Count

		case entities.FinishedLate:
			result.FinishedLateCount = s.Count

		case entities.Missed:
			result.OverdueCount = s.Count

		case entities.Cancelled:
			result.CancelledCount = s.Count
		}
	}
	return result
}
