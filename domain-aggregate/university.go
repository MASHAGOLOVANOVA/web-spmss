package domainaggregate

import "fmt"

type University struct {
	Id   string
	Name string
	City string
}

type Department struct {
	Id           string
	Name         string
	UniversityId string
}

type Faculty struct {
	Id           string
	Name         string
	DepartmentId string
}

type EducationalProgramme struct {
	Id               string
	Name             string
	EducationalLevel EducationalLevel
	FacultyId        string
}

type EducationalLevel int

const (
	BachelorsDegree EducationalLevel = iota
	MastersDegree
)

func (s EducationalLevel) String() string {
	switch s {
	case EducationalLevel(BachelorsDegree):
		return "Bachelor's degree"
	case EducationalLevel(MastersDegree):
		return "Master's degree"
	default:
		return fmt.Sprintf("%d", int(s))
	}
}
