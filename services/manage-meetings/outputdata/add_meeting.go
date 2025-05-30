package outputdata

import (
	entities "mvp-2-spms/domain-aggregate"
	"strconv"
)

type AddMeeting struct {
	Id int `json:"meeting_id"`
}

func MapToAddMeeting(meeting entities.Meeting) AddMeeting {
	sId, _ := strconv.Atoi(meeting.Id)
	return AddMeeting{
		Id: sId,
	}
}
