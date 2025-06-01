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
	NotStartedCount     int
	InProgressCount     int
	FinishedOnTimeCount int
	FinishedLateCount   int
	OverdueCount        int
	CancelledCount      int
}

func (ti TasksInfo) GetCompletionPercentage() float32 {
	allTasks := ti.NotStartedCount + ti.InProgressCount + ti.FinishedOnTimeCount + ti.FinishedLateCount + ti.OverdueCount
	if allTasks != 0 {
		return (float32(ti.FinishedOnTimeCount) + float32(ti.FinishedLateCount)) / float32(allTasks) * 100
	}
	return 0
}

func (ti TasksInfo) GetTotal() int {
	return ti.NotStartedCount + ti.InProgressCount + ti.FinishedOnTimeCount + ti.FinishedLateCount + ti.OverdueCount
}
