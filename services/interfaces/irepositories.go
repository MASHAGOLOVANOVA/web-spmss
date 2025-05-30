package interfaces

import (
	entities "mvp-2-spms/domain-aggregate"
	"mvp-2-spms/services/models"
	usecasemodels "mvp-2-spms/services/models"
)

type ResultAccount struct {
	Account usecasemodels.Account
	Err     error
}

type ResultStudentAccount struct {
	StudentAccount usecasemodels.StudentAccount
	Err            error
}

type ResultProfessor struct {
	Professor entities.Professor
	Err       error
}

type ResultPlannerIntegration struct {
	PlannerIntegration usecasemodels.PlannerIntegration
	Err                error
}

type ResultCloudDriveIntegration struct {
	CloudDriveIntegration usecasemodels.CloudDriveIntegration
	Err                   error
}

type ResultBaseIntegration struct {
	BaseIntegration usecasemodels.BaseIntegration
	Err             error
}

type ResultError struct {
	Err error
}

type IApplicationRepository interface {
	GetProfessors() ([]entities.Professor, error)
	GetApplicationsByStudent(studentId string) ([]entities.Apply, error)
	GetApplicationsByProfessor(profId string) ([]entities.Apply, error)
	GetApplicationsByProfessorAndStudent(profId string, studId string) ([]entities.Apply, error)
	Apply(apply entities.Apply) error
	UpdateApplication(apply entities.Apply) error
}

// transfers data in domain entities
type IProjetRepository interface {
	GetProfessorProjects(profId string) ([]entities.Project, error)
	GetProfessorProjectsWithFilters(profId string, statusFilter int) ([]entities.Project, error)
	// возвращать вообще все здесь??? а что делать если там нет чего-то в дб? как понять?
	// писать что будет возвращено в структуре
	// но тогда будет неявное раскрытие деталей реализации
	// ====> будем переделывать domain походу
	// потому что возвращать всю инфу (которой может быть дофига) очень затратно
	// т.е. сущность проекта не будет содержать список тасок
	// таски проекта будут получаться через обращение к бдшке
	// наверно так изначально предполагается
	GetProjectRepository(projId string) (models.Repository, error)
	GetProjectById(projId string) (entities.Project, error)
	CreateProject(entities.Project) (entities.Project, error)
	DeleteProjectById(projId string) error
	CreateProjectWithRepository(entities.Project, models.Repository) (models.ProjectInRepository, error)
	AssignDriveFolder(models.DriveProject) error
	GetProjectCloudFolderId(projId string) (uint, error)
	GetProjectCloudFolderID(projId string) (string, error)
	GetStudentCurrentProject(studId string) (entities.Project, error)
	GetProjectFolderLink(projId string) (string, error)
	GetProjectGradingById(projId string) (entities.ProjectGrading, error)
	GetProjectTaskInfoById(projId string) (models.TasksInfo, error)
	GetProjectMeetingInfoById(projId string) (models.MeetingInfo, error)
	UpdateProject(proj entities.Project) error
	UpdateProjectDefenceGrade(projId string, grade float32) error
	UpdateProjectSupRew(projId string, sr entities.SupervisorReview) error
}

// transfers data in domain entities
type IStudentRepository interface {
	GetStudentById(studId string) (entities.Student, error)
	GetStudents() ([]entities.Student, error)
	CreateStudent(entities.Student) (entities.Student, error)
}

type IUniversityRepository interface {
	GetEducationalProgrammeById(epId string) (entities.EducationalProgramme, error)
	GetEducationalProgrammeFullById(epId string) (models.EdProg, error)
	GetUniversityById(uId string) (entities.University, error)
	GetUniversityEducationalProgrammes(uniId string) ([]entities.EducationalProgramme, error)
}

// transfers data in domain entities
type IMeetingRepository interface {
	CreateMeeting(entities.Meeting) (entities.Meeting, error)
	AddSlot(slot entities.Slot, plannerId string) (entities.Slot, error)
	ChooseSlot(slotId int, studId int) error
	BindSlotToProject(slotId int, projectId int) error
	DeleteSlot(slotId int) error
	GetSlotById(slotId int) (entities.Slot, error)
	AssignPlannerMeeting(plannerMeeting models.PlannerMeeting) error
	GetProfessorMeetings(profId string) ([]entities.Slot, error)
	GetProfessorSlots(profId string, filter string) ([]entities.Slot, error)
	GetStudentMeetings(studId string) ([]entities.StudMeeting, error)
	GetProfessorStudentMeetings(profId string) ([]entities.StudMeeting, error)
	GetProjectMeetingByStudMeetingId(studMeetingId string) (entities.ProjectMeeting, error)
	GetMeetingPlannerId(meetId string) (string, error)
	GetMeetingById(meetId string) (entities.Meeting, error)
}

type IAccountRepository interface {
	GetProfessorById(id string) <-chan ResultProfessor
	AddProfessor(entities.Professor) <-chan ResultProfessor

	GetAccountByLogin(login string) <-chan ResultAccount
	GetStudentAccountByLogin(login string) <-chan ResultStudentAccount
	GetStudentAccountByStudentId(id string) <-chan ResultStudentAccount
	AddAccount(models.Account) <-chan ResultError
	AddStudentAccount(account models.StudentAccount) <-chan ResultError

	GetAccountPlannerData(id string) <-chan ResultPlannerIntegration  // returns planner integration for later usage of api key???
	GetAccountDriveData(id string) <-chan ResultCloudDriveIntegration // returns drive integration for later usage of api key???
	GetAccountRepoHubData(id string) <-chan ResultBaseIntegration     // returns repo hub integration for later usage of api key???

	AddAccountPlannerIntegration(models.PlannerIntegration) <-chan ResultError
	AddAccountDriveIntegration(models.CloudDriveIntegration) <-chan ResultError
	AddAccountRepoHubIntegration(models.BaseIntegration) <-chan ResultError

	UpdateAccountPlannerIntegration(models.PlannerIntegration) <-chan ResultError
	UpdateAccountDriveIntegration(models.CloudDriveIntegration) <-chan ResultError
	UpdateAccountRepoHubIntegration(models.BaseIntegration) <-chan ResultError
}

type ITaskRepository interface {
	CreateTask(entities.Task) (entities.Task, error)
	UpdateTask(entities.Task) error
	AssignDriveTask(models.DriveTask) error
	GetProjectTasks(projId string) ([]entities.Task, error)
	GetTaskById(id string) (entities.Task, error)
	GetProjectTasksWithCloud(projId string) ([]models.DriveTask, error)
}
