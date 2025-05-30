package domainaggregate

import (
	"fmt"
	"time"
)

type Meeting struct {
	Id            string
	Name          string
	Description   string
	OrganizerId   string
	ParticipantId string
	ProjectId     string
	Time          time.Time
	IsOnline      bool
	Status        MeetingStatus
}

type MeetingStatus int

const (
	MeetingPlanned MeetingStatus = iota
	MeetingPassed
	MeetingCancelled
)

func (s MeetingStatus) String() string {
	switch s {
	case MeetingStatus(MeetingPlanned):
		return "Planned"
	case MeetingStatus(MeetingPassed):
		return "Passed"
	case MeetingStatus(MeetingCancelled):
		return "Cancelled"
	default:
		return fmt.Sprintf("%d", int(s))
	}
}
