package outputdata

import "mvp-2-spms/services/models"

type GetProfessorIntegrPlanners struct {
	Planners []getProfessorIntegrPlanner `json:"planners"`
}

type getProfessorIntegrPlanner struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

func MapToGetProfessorIntegrPlanners(planners []models.PlannerData) GetProfessorIntegrPlanners {
	result := GetProfessorIntegrPlanners{
		Planners: []getProfessorIntegrPlanner{},
	}
	for _, pl := range planners {
		result.Planners = append(result.Planners, getProfessorIntegrPlanner{
			Id:   pl.Id,
			Name: pl.Name,
		})
	}
	return result
}
