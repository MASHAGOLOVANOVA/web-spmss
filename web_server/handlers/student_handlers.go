package handlers

import (
	"mvp-2-spms/web_server/handlers/interfaces"
)

type StudentHandler struct {
	studentInteractor interfaces.IStudentInteractor
}

func InitStudentHandler(studInteractor interfaces.IStudentInteractor) StudentHandler {
	return StudentHandler{
		studentInteractor: studInteractor,
	}
}
