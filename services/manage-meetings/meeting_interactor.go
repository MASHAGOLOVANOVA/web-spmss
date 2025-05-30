package managemeetings

import (
	"errors"
	"fmt"
	"log"
	domainaggregate "mvp-2-spms/domain-aggregate"
	"mvp-2-spms/internal"
	"mvp-2-spms/services/interfaces"
	ainputdata "mvp-2-spms/services/manage-accounts/inputdata"
	aoutputdata "mvp-2-spms/services/manage-accounts/outputdata"
	"mvp-2-spms/services/manage-meetings/inputdata"
	"mvp-2-spms/services/manage-meetings/outputdata"
	"mvp-2-spms/services/models"
	"strconv"
	"time"

	"golang.org/x/oauth2"
)

type MeetingInteractor struct {
	meetingRepo interfaces.IMeetingRepository
	accountRepo interfaces.IAccountRepository
	projectRepo interfaces.IProjetRepository
	studentRepo interfaces.IStudentRepository
	profRepo    interfaces.IApplicationRepository
	planer      internal.Planners
}

func InitMeetingInteractor(mtRepo interfaces.IMeetingRepository, accRepo interfaces.IAccountRepository,
	sRepo interfaces.IStudentRepository, projRepo interfaces.IProjetRepository, profRepo interfaces.IApplicationRepository, planer internal.Planners) *MeetingInteractor {
	return &MeetingInteractor{
		meetingRepo: mtRepo,
		accountRepo: accRepo,
		studentRepo: sRepo,
		projectRepo: projRepo,
		profRepo:    profRepo,
		planer:      planer,
	}
}

func (m *MeetingInteractor) GetProfessorStudentMeetings(profId int, planner interfaces.IPlannerService, input inputdata.GetProfessorMeetings) (outputdata.GetStudentSlots, error) {
	slots, err := m.meetingRepo.GetProfessorStudentMeetings(strconv.Itoa(profId))
	if err != nil {
		return outputdata.GetStudentSlots{}, err
	}

	if err != nil {
		return outputdata.GetStudentSlots{}, err
	}

	resChan := m.accountRepo.GetAccountPlannerData(fmt.Sprint(profId))
	resPlanner := <-resChan

	plannerFound := true
	if resPlanner.Err != nil {
		if !errors.Is(resPlanner.Err, models.ErrAccountPlannerDataNotFound) {
			return outputdata.GetStudentSlots{}, resPlanner.Err
		}
		plannerFound = false
	}

	if !plannerFound {
		return outputdata.GetStudentSlots{}, models.ErrAccountPlannerDataNotFound
	}

	token := &oauth2.Token{
		RefreshToken: resPlanner.PlannerIntegration.ApiKey,
	}

	err = planner.Authentificate(token)
	if err != nil {
		return outputdata.GetStudentSlots{}, err
	}

	entities := []outputdata.GetStudentSlotsEntities{}
	for _, slot := range slots {
		atoi, err := strconv.Atoi(slot.SlotId)
		slotEntity, err := m.meetingRepo.GetSlotById(atoi)
		if err != nil {
			return outputdata.GetStudentSlots{}, err
		}

		event, err1 := planner.FindMeetingById(slotEntity.EventId, resPlanner.PlannerIntegration)
		if err1 == nil && event != nil {
			startTime, err := time.Parse(time.RFC3339, event.Start.DateTime)
			if err != nil {
				log.Printf("Error parsing start time: %v", err)
				continue // Skip this iteration if there's an error
			}

			endTime, err := time.Parse(time.RFC3339, event.End.DateTime)
			if err != nil {
				log.Printf("Error parsing end time: %v", err)
				continue // Skip this iteration if there's an error
			}

			student, err := m.studentRepo.GetStudentById(slot.StudentId)
			professor := <-m.accountRepo.GetProfessorById(slotEntity.ProfessorId)
			projMeeting, err := m.meetingRepo.GetProjectMeetingByStudMeetingId(slot.Id)
			if err != nil {
				return outputdata.GetStudentSlots{}, err
			}
			project := domainaggregate.Project{}
			if projMeeting.Id != "" {

				project, err = m.projectRepo.GetProjectById(projMeeting.ProjectId)
			}

			includeMeeting := true
			if input.From != nil {
				includeMeeting = includeMeeting && (startTime.After(*input.From) || startTime.Equal(*input.From))
			}
			if input.To != nil {
				includeMeeting = includeMeeting && (endTime.Before(*input.To) || endTime.Equal(*input.To))
			}

			if includeMeeting {

			}
			slotsEntities := outputdata.GetStudentSlotsEntities{
				StudMeeting:   slot,
				Slot:          slotEntity,
				Description:   event.Description,
				StartTime:     startTime,
				EndTime:       endTime,
				StudentName:   student.FullNameToString(),
				ProfessorName: professor.Professor.FullNameToString(),
				Project:       project,
			}
			entities = append(entities, slotsEntities)
		}
	}
	return outputdata.MapToGetStudentSlots(entities), nil
}

func (m *MeetingInteractor) GetStudentMeetings(studId int) (outputdata.GetStudentSlots, error) {
	slots, err := m.meetingRepo.GetStudentMeetings(strconv.Itoa(studId))
	if err != nil {
		return outputdata.GetStudentSlots{}, err
	}
	entities := []outputdata.GetStudentSlotsEntities{}
	for _, slot := range slots {
		atoi, err := strconv.Atoi(slot.SlotId)
		slotEntity, err := m.meetingRepo.GetSlotById(atoi)
		if err != nil {
			return outputdata.GetStudentSlots{}, err
		}

		professorID, err := strconv.Atoi(slotEntity.ProfessorId)
		if err != nil {
			continue
		}

		integInput := ainputdata.GetPlannerIntegration{
			AccountId: uint(professorID), // Convert to uint if that's what AccountId expects
		}

		resChan := m.accountRepo.GetAccountPlannerData(fmt.Sprint(integInput.AccountId))
		resPlanner := <-resChan

		if resPlanner.Err != nil {
			continue
		}

		calendarInfo := aoutputdata.MapToGetPlannerIntegration(resPlanner.PlannerIntegration)

		var planner interfaces.IPlannerService
		planner = m.planer[models.PlannerName(calendarInfo.Type)]

		plannerFound := true
		if resPlanner.Err != nil {
			if !errors.Is(resPlanner.Err, models.ErrAccountPlannerDataNotFound) {
				continue
			}
			plannerFound = false
		}

		if !plannerFound {
			continue
		}

		token := &oauth2.Token{
			RefreshToken: resPlanner.PlannerIntegration.ApiKey,
		}

		err = planner.Authentificate(token)
		if err != nil {
			continue
		}

		event, err1 := planner.FindMeetingById(slotEntity.EventId, resPlanner.PlannerIntegration)
		if err1 == nil && event != nil {
			startTime, err := time.Parse(time.RFC3339, event.Start.DateTime)
			if err != nil {
				log.Printf("Error parsing start time: %v", err)
				continue // Skip this iteration if there's an error
			}

			endTime, err := time.Parse(time.RFC3339, event.End.DateTime)
			if err != nil {
				log.Printf("Error parsing end time: %v", err)
				continue // Skip this iteration if there's an error
			}

			student, err := m.studentRepo.GetStudentById(strconv.Itoa(studId))
			professor := <-m.accountRepo.GetProfessorById(slotEntity.ProfessorId)

			slotsEntities := outputdata.GetStudentSlotsEntities{
				StudMeeting:   slot,
				Slot:          slotEntity,
				Description:   event.Description,
				StartTime:     startTime,
				EndTime:       endTime,
				StudentName:   student.FullNameToString(),
				ProfessorName: professor.Professor.FullNameToString(),
			}
			entities = append(entities, slotsEntities)
		}
	}
	if err != nil {
		return outputdata.GetStudentSlots{}, err
	}

	return outputdata.MapToGetStudentSlots(entities), nil

}

func (m *MeetingInteractor) GetProfessorSlots(studId int, profId int, planner interfaces.IPlannerService, filter string) (outputdata.GetProfessorSlots, error) {
	applications, err := m.profRepo.GetApplicationsByProfessorAndStudent(strconv.Itoa(profId), strconv.Itoa(studId))
	if err != nil {
		return outputdata.GetProfessorSlots{}, err
	}
	if len(applications) == 0 {
		return outputdata.GetProfessorSlots{}, err
	}

	slots, err := m.meetingRepo.GetProfessorSlots(strconv.Itoa(profId), filter)
	if err != nil {
		return outputdata.GetProfessorSlots{}, err
	}

	resChan := m.accountRepo.GetAccountPlannerData(fmt.Sprint(profId))
	resPlanner := <-resChan

	plannerFound := true
	if resPlanner.Err != nil {
		if !errors.Is(resPlanner.Err, models.ErrAccountPlannerDataNotFound) {
			return outputdata.GetProfessorSlots{}, resPlanner.Err
		}
		plannerFound = false
	}

	if !plannerFound {
		return outputdata.GetProfessorSlots{}, models.ErrAccountPlannerDataNotFound
	}

	token := &oauth2.Token{
		RefreshToken: resPlanner.PlannerIntegration.ApiKey,
	}

	err = planner.Authentificate(token)
	if err != nil {
		return outputdata.GetProfessorSlots{}, err
	}

	entities := []outputdata.GetProfesorSlotsEntities{}
	// add meeting to calendar
	for _, slot := range slots {
		event, err1 := planner.FindMeetingById(slot.EventId, resPlanner.PlannerIntegration)
		if err1 == nil && event != nil {
			startTime, err := time.Parse(time.RFC3339, event.Start.DateTime)
			if err != nil {
				log.Printf("Error parsing start time: %v", err)
				continue // Skip this iteration if there's an error
			}

			endTime, err := time.Parse(time.RFC3339, event.End.DateTime)
			if err != nil {
				log.Printf("Error parsing end time: %v", err)
				continue // Skip this iteration if there's an error
			}
			slotsEntities := outputdata.GetProfesorSlotsEntities{
				Slot:        slot,
				Description: event.Description,
				StartTime:   startTime,
				EndTime:     endTime,
			}
			entities = append(entities, slotsEntities)
		}
	}
	if err != nil {
		return outputdata.GetProfessorSlots{}, err
	}

	return outputdata.MapToGetProfesorSlots(entities), nil
}

func (m *MeetingInteractor) DeleteSlot(profId int, slotId int, planner interfaces.IPlannerService) error {
	slot, err := m.GetSlotById(slotId)
	if err != nil {
		return err
	}

	atoi, err := strconv.Atoi(slot.ProfessorId)
	if atoi != profId {
		return err
	}

	plannerFound := true
	resChan := m.accountRepo.GetAccountPlannerData(fmt.Sprint(profId))
	resPlanner := <-resChan
	if resPlanner.Err != nil {
		if !errors.Is(resPlanner.Err, models.ErrAccountPlannerDataNotFound) {
			return resPlanner.Err
		}
		plannerFound = false
	}

	if plannerFound {
		//////////////////////////////////////////////////////////////////////////////////////////////////////
		// check for access token first????????????????????????????????????????????
		token := &oauth2.Token{
			RefreshToken: resPlanner.PlannerIntegration.ApiKey,
		}

		err := planner.Authentificate(token)
		if err != nil {
			return err
		}

		// add meeting to calendar
		_, err = planner.DeleteSlot(slot.EventId, resPlanner.PlannerIntegration)
		if err != nil {
			return err
		}
	}

	err = m.meetingRepo.DeleteSlot(slotId)
	if err != nil {
		return err
	}
	return nil
}

func (m *MeetingInteractor) ChooseSlot(studId int, slotId int) error {
	slot, err := m.GetSlotById(slotId)
	if err != nil {
		return err
	}

	applications, err := m.profRepo.GetApplicationsByProfessorAndStudent(slot.ProfessorId, strconv.Itoa(studId))
	if err != nil {
		return err
	}
	if len(applications) == 0 {
		return nil
	}

	err = m.meetingRepo.ChooseSlot(slotId, studId)
	if err != nil {
		return err
	}
	return nil
}

func (m *MeetingInteractor) BindSlotToProject(slotId int, projectId int) error {
	err := m.meetingRepo.BindSlotToProject(slotId, projectId)
	if err != nil {
		return err
	}
	return nil
}

func (m *MeetingInteractor) GetSlotById(slotId int) (outputdata.GetSlot, error) {
	slot, err := m.meetingRepo.GetSlotById(slotId)
	if err != nil {
		return outputdata.GetSlot{}, err
	}
	return outputdata.MapToGetSlot(slot), nil
}

func (m *MeetingInteractor) UpdateSlot(slotId int, input inputdata.AddSlot, planner interfaces.IPlannerService) error {
	plannerFound := true
	resChan := m.accountRepo.GetAccountPlannerData(fmt.Sprint(input.ProfessorId))
	resPlanner := <-resChan
	if resPlanner.Err != nil {
		if !errors.Is(resPlanner.Err, models.ErrAccountPlannerDataNotFound) {
			return resPlanner.Err
		}
		plannerFound = false
	}

	slot, _ := m.GetSlotById(slotId)

	if plannerFound {
		//////////////////////////////////////////////////////////////////////////////////////////////////////
		// check for access token first????????????????????????????????????????????
		token := &oauth2.Token{
			RefreshToken: resPlanner.PlannerIntegration.ApiKey,
		}

		err := planner.Authentificate(token)
		if err != nil {
			return err
		}

		// add meeting to calendar
		err = planner.UpdateSlot(slot.EventId, input, resPlanner.PlannerIntegration)
		if err != nil {
			return err
		}
	}
	return nil
}

func (m *MeetingInteractor) AddSlot(input inputdata.AddSlot, planner interfaces.IPlannerService) (outputdata.AddSlot, error) {
	plannerFound := true
	resChan := m.accountRepo.GetAccountPlannerData(fmt.Sprint(input.ProfessorId))
	resPlanner := <-resChan
	if resPlanner.Err != nil {
		if !errors.Is(resPlanner.Err, models.ErrAccountPlannerDataNotFound) {
			return outputdata.AddSlot{}, resPlanner.Err
		}
		plannerFound = false
	}

	meeitngPlanner := models.PlannerSlot{}
	if plannerFound {
		//////////////////////////////////////////////////////////////////////////////////////////////////////
		// check for access token first????????????????????????????????????????????
		token := &oauth2.Token{
			RefreshToken: resPlanner.PlannerIntegration.ApiKey,
		}

		err := planner.Authentificate(token)
		if err != nil {
			return outputdata.AddSlot{}, err
		}

		// add meeting to calendar
		meeitngPlanner, err = planner.AddSlot(input, resPlanner.PlannerIntegration)
		if err != nil {
			return outputdata.AddSlot{}, err
		}
	}

	slot, err := m.meetingRepo.AddSlot(meeitngPlanner.Slot, meeitngPlanner.MeetingPlannerId)
	if err != nil {
		return outputdata.AddSlot{}, err
	}
	// returning id
	output := outputdata.MapToAddSlot(slot)
	return output, nil
}

func (m *MeetingInteractor) AddMeeting(input inputdata.AddMeeting, planner interfaces.IPlannerService) (outputdata.AddMeeting, error) {
	// adding meeting to db, returns created meeting (with id)
	meeting, err := m.meetingRepo.CreateMeeting(input.MapToMeetingEntity())
	if err != nil {
		return outputdata.AddMeeting{}, err
	}

	// getting calendar info, should be checked for existance later
	plannerFound := true
	resChan := m.accountRepo.GetAccountPlannerData(fmt.Sprint(input.ProfessorId))
	resPlanner := <-resChan
	if resPlanner.Err != nil {
		if !errors.Is(resPlanner.Err, models.ErrAccountPlannerDataNotFound) {
			return outputdata.AddMeeting{}, resPlanner.Err
		}
		plannerFound = false
	}

	meeitngPlanner := models.PlannerMeeting{Meeting: meeting}
	if plannerFound {
		//////////////////////////////////////////////////////////////////////////////////////////////////////
		// check for access token first????????????????????????????????????????????
		token := &oauth2.Token{
			RefreshToken: resPlanner.PlannerIntegration.ApiKey,
		}

		err = planner.Authentificate(token)
		if err != nil {
			return outputdata.AddMeeting{}, err
		}

		// add meeting to calendar
		meeitngPlanner, err = planner.AddMeeting(meeting, resPlanner.PlannerIntegration)
		if err != nil {
			return outputdata.AddMeeting{}, err
		}
	}

	// add meeting id from planner
	err = m.meetingRepo.AssignPlannerMeeting(meeitngPlanner)
	if err != nil {
		return outputdata.AddMeeting{}, err
	}

	// returning id
	output := outputdata.MapToAddMeeting(meeting)
	return output, nil
}

func (m *MeetingInteractor) GetProfessorMeetings(input inputdata.GetProfessorMeetings, planner interfaces.IPlannerService) (outputdata.GetProfesorMeetings, error) {
	// get from db
	meetings, err := m.meetingRepo.GetProfessorMeetings(fmt.Sprint(input.ProfessorId))
	if err != nil {
		return outputdata.GetProfesorMeetings{}, err
	}

	meetEntities := []outputdata.GetProfesorMeetingsEntities{}
	// getting calendar info, should be checked for existance later
	plannerFound := true
	resChan := m.accountRepo.GetAccountPlannerData(fmt.Sprint(input.ProfessorId))
	resPlanner := <-resChan
	if resPlanner.Err != nil {
		if !errors.Is(resPlanner.Err, models.ErrAccountPlannerDataNotFound) {
			return outputdata.GetProfesorMeetings{}, resPlanner.Err
		}
		plannerFound = false
	}

	if plannerFound {
		// check for access token first
		token := &oauth2.Token{
			RefreshToken: resPlanner.PlannerIntegration.ApiKey,
		}

		err = planner.Authentificate(token)
		if err != nil {
			return outputdata.GetProfesorMeetings{}, err
		}

		for _, meet := range meetings {
			meeting, err := planner.FindMeetingById(meet.EventId, resPlanner.PlannerIntegration)
			if err != nil {
				return outputdata.GetProfesorMeetings{}, err
			}

			// Skip if meeting times are nil
			if meeting.Start == nil || meeting.End == nil {
				continue
			}

			// Parse meeting times
			meetingStart, err := time.Parse(time.RFC3339, meeting.Start.DateTime)
			if err != nil {
				return outputdata.GetProfesorMeetings{}, err
			}

			meetingEnd, err := time.Parse(time.RFC3339, meeting.End.DateTime)
			if err != nil {
				return outputdata.GetProfesorMeetings{}, err
			}

			// Check if meeting falls within the requested time range
			includeMeeting := true
			if input.From != nil {
				includeMeeting = includeMeeting && (meetingStart.After(*input.From) || meetingStart.Equal(*input.From))
			}
			if input.To != nil {
				includeMeeting = includeMeeting && (meetingEnd.Before(*input.To) || meetingEnd.Equal(*input.To))
			}

			if includeMeeting {
				// TODO: You need to define how to get student, proj, and hasPlanner
				meetEntities = append(meetEntities, outputdata.GetProfesorMeetingsEntities{})
			}
		}
	}

	// Return the final output
	return outputdata.MapToGetProfesorMeetings(meetEntities), nil
}
