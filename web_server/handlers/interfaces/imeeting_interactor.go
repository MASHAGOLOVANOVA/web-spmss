package interfaces

import (
	"mvp-2-spms/services/interfaces"
	"mvp-2-spms/services/manage-meetings/inputdata"
	"mvp-2-spms/services/manage-meetings/outputdata"
)

type IMeetingInteractor interface {
	AddSlot(input inputdata.AddSlot, planner interfaces.IPlannerService) (outputdata.AddSlot, error)
	UpdateSlot(slotId int, input inputdata.AddSlot, planner interfaces.IPlannerService) error
	ChooseSlot(studId int, slotId int) error
	BindSlotToProject(slotId int, projectId int) error
	DeleteSlot(profId int, slotId int, planner interfaces.IPlannerService) error
	GetProfessorSlots(studId int, profId int, planner interfaces.IPlannerService,
		filter string) (outputdata.GetProfessorSlots, error)
	GetStudentMeetings(studId int) (outputdata.GetStudentSlots, error)
	GetProfessorStudentMeetings(profId int, planner interfaces.IPlannerService,
		input inputdata.GetProfessorMeetings) (outputdata.GetStudentSlots, error)
}
