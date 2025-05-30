package outputdata

import (
	"mvp-2-spms/services/models"
	"strconv"
	"time"
)

type GetProjectStatsById struct {
	Id            int                       `json:"id"`
	TotalMeetings int                       `json:"total_meetings"`
	Grades        getProjectStatsByIdGrades `json:"grades"`
	TasksDone     int                       `json:"tasks_done"`
	TasksDonePerc float32                   `json:"tasks_done_percent"`
	TotalTasks    int                       `json:"total_tasks"`
}

func MapToGetProjectStatsById(stats models.ProjectStats) GetProjectStatsById {
	pId, _ := strconv.Atoi(stats.ProjectId)
	crits := []getProjectStatsByIdCrit{}
	for _, criteria := range stats.SupervisorReview.Criterias {
		crits = append(crits, getProjectStatsByIdCrit{
			Criteria: criteria.Description,
			Grade:    criteria.Grade,
			Weight:   criteria.Weight,
		})
	}
	var supr *getProjectStatsByIdSupRew
	if stats.SupervisorReview.Id != 0 {
		supr = &getProjectStatsByIdSupRew{
			Id:           int(stats.SupervisorReview.Id),
			CreationDate: stats.SupervisorReview.CreationDate,
			Criterias:    crits,
		}
	}
	return GetProjectStatsById{
		Id:            pId,
		TotalMeetings: stats.MeetingInfo.PassedCount,
		Grades: getProjectStatsByIdGrades{
			DefenctGrade:     stats.DefenceGrade,
			SupervisorGrade:  stats.SupervisorReview.GetGrade(),
			FinalGrade:       stats.CalculateGrade(),
			SupervisorReview: supr,
		},
		TasksDone:     stats.FinishedCount,
		TotalTasks:    stats.GetTotal(),
		TasksDonePerc: stats.GetCompletionPercentage(),
	}
}

type getProjectStatsByIdGrades struct {
	DefenctGrade     float32                    `json:"defence_grade,omitempty"`
	SupervisorGrade  float32                    `json:"supervisor_grade,omitempty"`
	SupervisorReview *getProjectStatsByIdSupRew `json:"supervisor_review,omitempty"`
	FinalGrade       float32                    `json:"final_grade,omitempty"`
}

type getProjectStatsByIdSupRew struct {
	Id           int                       `json:"id"`
	Criterias    []getProjectStatsByIdCrit `json:"criterias,omitempty"`
	CreationDate time.Time                 `json:"created"`
}
type getProjectStatsByIdCrit struct {
	Criteria string  `json:"criteria"`
	Grade    float32 `json:"grade,omitempty"`
	Weight   float32 `json:"weight"`
}
