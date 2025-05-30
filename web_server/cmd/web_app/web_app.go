package main

import (
	"log"
	"mvp-2-spms/database"
	accountrepository "mvp-2-spms/database/account-repository"
	meetingrepository "mvp-2-spms/database/meeting-repository"
	professorrepository "mvp-2-spms/database/professor-repository"
	projectrepository "mvp-2-spms/database/project-repository"
	studentrepository "mvp-2-spms/database/student-repository"
	taskrepository "mvp-2-spms/database/task-repository"
	unirepository "mvp-2-spms/database/university-repository"
	googleDrive "mvp-2-spms/integrations/cloud-drive/google-drive"
	yandexdisc "mvp-2-spms/integrations/cloud-drive/yandex-disc"
	"mvp-2-spms/integrations/git-repository-hub/github"
	googleapi "mvp-2-spms/integrations/google-api"
	googleCalendar "mvp-2-spms/integrations/planner-service/google-calendar"
	yandexapi "mvp-2-spms/integrations/yandex-api"
	"mvp-2-spms/internal"
	manageaccounts "mvp-2-spms/services/manage-accounts"
	managemeetings "mvp-2-spms/services/manage-meetings"
	manageprofessors "mvp-2-spms/services/manage-professors"
	manageprojects "mvp-2-spms/services/manage-projects"
	managestudents "mvp-2-spms/services/manage-students"
	managetasks "mvp-2-spms/services/manage-tasks"
	manageuniversities "mvp-2-spms/services/manage-universities"
	"mvp-2-spms/services/models"
	"mvp-2-spms/web_server/config"
	"mvp-2-spms/web_server/routes"
	"mvp-2-spms/web_server/session"
	"net/http"
	"os"

	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/drive/v3"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func main() {

	serverConfig, err := config.ReadConfigFromFile("web_server/cmd/web_app/server_config.json")
	if err != nil {
		log.Fatal(err.Error())
	}

	err = config.SetConfigEnvVars(serverConfig)
	if err != nil {
		log.Fatal(err.Error())
	}

	session.SetBotTokenFromJson("web_server/cmd/web_app/credentials_bot.json")
	dbConfig, err := database.ReadDBConfigFromFile("web_server/cmd/web_app/db_config.json")
	if err != nil {
		log.Fatal(err.Error())
	}

	var gdb *gorm.DB

	// Открываем соединение с базой данных
	gdb, err = gorm.Open(mysql.Open(dbConfig.ConnString), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: dbConfig.SingularTable, // использовать единственное имя таблицы
		},
	})

	if err != nil {
		log.Fatal(err.Error())
	}

	db := database.InitDatabade(gdb)
	repos := internal.Repositories{
		Projects:     projectrepository.InitProjectRepository(*db),
		Students:     studentrepository.InitStudentRepository(*db),
		Universities: unirepository.InitUniversityRepository(*db),
		Meetings:     meetingrepository.InitMeetingRepository(*db),
		Accounts:     accountrepository.InitAccountRepository(*db),
		Tasks:        taskrepository.InitTaskRepository(*db),
		Professors:   professorrepository.InitApplicationRepository(*db),
	}

	repoHub := github.InitGithub(github.InitGithubAPI())

	gCalendarApi := googleCalendar.InitCalendarApi(googleapi.InitGoogleAPI(calendar.CalendarScope))
	gCalendar := googleCalendar.InitGoogleCalendar(gCalendarApi)
	gDriveApi := googleDrive.InitDriveApi(googleapi.InitGoogleAPI(drive.DriveScope))
	gDrive := googleDrive.InitGoogleDrive(gDriveApi)
	yandexAPI, err := yandexapi.InitYandexAPI()
	yandexDisk := yandexdisc.NewYandexDisk(yandexAPI)

	integrations := internal.Integrations{
		GitRepositoryHubs: make(internal.GitRepositoryHubs),
		CloudDrives:       make(internal.CloudDrives),
		Planners:          make(internal.Planners),
	}

	integrations.Planners[models.GoogleCalendar] = gCalendar
	integrations.CloudDrives[models.GoogleDrive] = gDrive
	integrations.CloudDrives[models.YandexDisk] = yandexDisk
	integrations.GitRepositoryHubs[models.GitHub] = repoHub

	interactors := internal.Intercators{
		AccountManager:   manageaccounts.InitAccountInteractor(repos.Accounts, repos.Universities, repos.Students),
		ProjectManager:   manageprojects.InitProjectInteractor(repos.Projects, repos.Students, repos.Universities, repos.Accounts),
		StudentManager:   managestudents.InitStudentInteractor(repos.Students, repos.Projects, repos.Universities),
		MeetingManager:   managemeetings.InitMeetingInteractor(repos.Meetings, repos.Accounts, repos.Students, repos.Projects, repos.Professors, integrations.Planners),
		TaskManager:      managetasks.InitTaskInteractor(repos.Projects, repos.Tasks, repos.Accounts),
		UnversityManager: manageuniversities.InitUniversityInteractor(repos.Universities),
		ProfessorManager: manageprofessors.InitApplicationInteractor(repos.Professors, repos.Accounts, repos.Students),
	}

	app := internal.StudentsProjectsManagementApp{
		Intercators:  interactors,
		Integrations: integrations,
	}
	router := routes.SetupRouter(&app)
	if err := http.ListenAndServe(os.Getenv("SERVER_PORT"), router.Router()); err != nil {
		log.Printf("Ошибка при настройке env: %v", err)
	}
}
