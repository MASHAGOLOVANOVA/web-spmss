package domainaggregate

import "time"

const (
	defenceGradeWeight    = 0.6
	supervisorGradeWeight = 1 - defenceGradeWeight
)

type ProjectGrading struct {
	ProjectId        string
	DefenceGrade     float32
	SupervisorReview SupervisorReview
}

// what if there're no grades yet?
func (pg ProjectGrading) CalculateGrade() float32 {
	return pg.SupervisorReview.GetGrade()*supervisorGradeWeight + pg.DefenceGrade*defenceGradeWeight
}

type SupervisorReview struct {
	Id           uint
	CreationDate time.Time
	Criterias    []Criteria
}

// what if there're no grades yet?
func (s *SupervisorReview) GetGrade() float32 {
	var supGrade float32 = 0
	for _, gr := range s.Criterias {
		supGrade += gr.Grade * gr.Weight
	}
	return supGrade
}

type Criteria struct {
	Description string
	Grade       float32
	Weight      float32 // from 0 to 1, sum of criterias = 1
}
