package interfaces

import (
	"mvp-2-spms/services/manage-universities/inputdata"
	"mvp-2-spms/services/manage-universities/outputdata"
)

type IUniversityInteractor interface {
	GetUniEdProgrammes(input inputdata.GetUniEducationalProgrammes) (outputdata.GetUniEducationalProgrammes, error)
}
