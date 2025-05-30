package models

import (
	entities "mvp-2-spms/domain-aggregate"
)

type ProjectStats struct {
	entities.ProjectGrading
	MeetingInfo
	TasksInfo
}

type MeetingInfo struct {
	PassedCount int
}
type TasksInfo struct {
	NotStartedCount int
	InProgressCount int
	FinishedCount   int
}

func (ti TasksInfo) GetCompletionPercentage() float32 {
	allTasks := ti.NotStartedCount + ti.InProgressCount + ti.FinishedCount
	if allTasks != 0 {
		return float32(ti.FinishedCount) / float32(allTasks) * 100
	}
	return 0
}

func (ti TasksInfo) GetTotal() int {
	return ti.NotStartedCount + ti.InProgressCount + ti.FinishedCount
}
