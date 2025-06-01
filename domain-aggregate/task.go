package domainaggregate

import (
	"fmt"
	"time"
)

type TaskStatus int

const (
	NotStarted TaskStatus = iota
	InProgress
	FinishedOnTime
	FinishedLate
	Cancelled
	Missed
)

func (s TaskStatus) String() string {
	switch s {
	case NotStarted:
		return "Не начато"
	case InProgress:
		return "В процессе"
	case FinishedOnTime:
		return "Завершено (вовремя)"
	case FinishedLate:
		return "Завершено (с опозданием)"
	case Cancelled:
		return "Отменено"
	case Missed:
		return "Просрочено"
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
