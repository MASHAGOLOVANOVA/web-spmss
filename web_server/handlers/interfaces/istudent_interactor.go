package interfaces

import (
	"mvp-2-spms/services/manage-students/inputdata"
	"mvp-2-spms/services/manage-students/outputdata"
)

type IStudentInteractor interface {
	AddStudent(input inputdata.AddStudent) (outputdata.AddStudent, error)
	GetStudents(input inputdata.GetStudents) (outputdata.GetStudents, error)
}
