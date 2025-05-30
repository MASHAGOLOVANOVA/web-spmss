package domainaggregate

import (
	"fmt"
	"time"
)

type TaskStatus int

const (
	NotStarted TaskStatus = iota
	InProgress
	Finished
)

func (s TaskStatus) String() string {
	switch s {
	case TaskStatus(NotStarted):
		return "Not Started"
	case TaskStatus(InProgress):
		return "In Progress"
	case TaskStatus(Finished):
		return "Finished"
	default:
		return fmt.Sprintf("%d", int(s))
	}
}

type Task struct {
	Id          string
	ProjectId   string
	Name        string
	Description string
	Deadline    time.Time
	Status      TaskStatus
}
