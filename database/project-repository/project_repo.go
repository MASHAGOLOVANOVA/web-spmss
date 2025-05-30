package projectrepository

import (
	"database/sql"
	"errors"
	"fmt"
	"mvp-2-spms/database"
	"mvp-2-spms/database/models"
	entities "mvp-2-spms/domain-aggregate"
	usecasemodels "mvp-2-spms/services/models"
	"strconv"

	"gorm.io/gorm"
)

type ProjectRepository struct {
	dbContext database.Database
}

func InitProjectRepository(dbcxt database.Database) *ProjectRepository {
	return &ProjectRepository{
		dbContext: dbcxt,
	}
}

func (r *ProjectRepository) GetProfessorProjectsWithFilters(profId string, statusFilter int) ([]entities.Project, error) {
	var projectsDb []models.Project
	result := r.dbContext.DB.Select("*").Where("supervisor_id = ? and status_id = ?", profId, statusFilter).Find(&projectsDb)
	if result.Error != nil {
		return []entities.Project{}, result.Error
	}
	projects := []entities.Project{}
	for _, pj := range projectsDb {
		// вынести в маппер
		var participations []models.ProjectParticipation
		res := r.dbContext.DB.Select("*").Where("project_id = ?", pj.Id).Find(&participations)
		if res.Error != nil {
			return []entities.Project{}, result.Error
		}
		var studentIds []string
		for _, p := range participations {
			studentIds = append(studentIds, strconv.FormatUint(uint64(p.StudentId), 10))
		}
		projects = append(projects, pj.MapToEntity(studentIds))
	}
	return projects, nil
}

func (r *ProjectRepository) GetProfessorProjects(profId string) ([]entities.Project, error) {
	var projectsDb []models.Project
	result := r.dbContext.DB.Select("*").Where("supervisor_id = ?", profId).Find(&projectsDb)
	if result.Error != nil {
		return []entities.Project{}, result.Error
	}
	projects := []entities.Project{}
	for _, pj := range projectsDb {
		// вынести в маппер
		var participations []models.ProjectParticipation
		res := r.dbContext.DB.Select("*").Where("project_id = ?", pj.Id).Find(&participations)
		if res.Error != nil {
			return []entities.Project{}, result.Error
		}
		var studentIds []string
		for _, p := range participations {
			studentIds = append(studentIds, strconv.FormatUint(uint64(p.StudentId), 10))
		}
		projects = append(projects, pj.MapToEntity(studentIds))
	}
	return projects, nil
}

func (r *ProjectRepository) GetProjectRepository(projId string) (usecasemodels.Repository, error) {

	var repo models.Repository
	result := r.dbContext.DB.Select("*").Where("project_id = ?", projId).Take(&repo)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return usecasemodels.Repository{}, usecasemodels.ErrProjectRepoNotFound
		}
		return usecasemodels.Repository{}, result.Error
	}

	return repo.MapToUseCaseModel(), nil
}

func (r *ProjectRepository) GetProjectById(projId string) (entities.Project, error) {
	var project models.Project
	result := r.dbContext.DB.Select("*").Where("id = ?", projId).Take(&project)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return entities.Project{}, usecasemodels.ErrProjectNotFound
		}
		return entities.Project{}, result.Error
	}

	var participations []models.ProjectParticipation
	res := r.dbContext.DB.Select("*").Where("project_id = ?", project.Id).Find(&participations)
	if res.Error != nil {
		return entities.Project{}, result.Error
	}
	var studentIds []string
	for _, p := range participations {
		studentIds = append(studentIds, strconv.FormatUint(uint64(p.StudentId), 10))
	}

	return project.MapToEntity(studentIds), nil
}

func (r *ProjectRepository) DeleteProjectById(projId string) error {
	id, err := strconv.ParseUint(projId, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid project ID format: %v", err)
	}

	// Сначала проверяем существование
	var project models.Project
	if err := r.dbContext.DB.First(&project, "id = ?", uint(id)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return usecasemodels.ErrProjectNotFound
		}
		return err
	}

	// Затем удаляем
	if err := r.dbContext.DB.Delete(&project).Error; err != nil {
		return err
	}

	return nil
}

func (r *ProjectRepository) CreateProject(project entities.Project) (entities.Project, error) {
	dbProject := models.Project{}
	dbProject.MapEntityToThis(project)

	result := r.dbContext.DB.Create(&dbProject)
	if result.Error != nil {
		return entities.Project{}, result.Error
	}

	var participations []models.ProjectParticipation
	res := r.dbContext.DB.Select("*").Where("project_id = ?", dbProject.Id).Find(&participations)
	if res.Error != nil {
		return entities.Project{}, result.Error
	}
	var studentIds []string
	for _, p := range participations {
		studentIds = append(studentIds, strconv.FormatUint(uint64(p.StudentId), 10))
	}

	return dbProject.MapToEntity(studentIds), nil
}

func (r *ProjectRepository) CreateProjectWithRepository(project entities.Project, repo usecasemodels.Repository) (usecasemodels.ProjectInRepository, error) {
	dbRepo := models.Repository{}
	dbRepo.MapModelToThis(repo)

	dbProject := models.Project{}
	dbProject.MapEntityToThis(project)

	err := r.dbContext.DB.Transaction(func(tx *gorm.DB) error {

		result := tx.Create(&dbProject)
		if result.Error != nil {
			return result.Error
		}

		dbRepo.ProjectId = int(dbProject.Id)
		result = tx.Create(&dbRepo)
		if result.Error != nil {
			return result.Error
		}

		participations := make([]models.ProjectParticipation, 0, len(project.StudentIds))
		for _, studentId := range project.StudentIds {
			parsedID, err := strconv.ParseUint(studentId, 10, 64)
			if err != nil {
				return err
			}

			participations = append(participations, models.ProjectParticipation{
				ProjectId: dbProject.Id,
				StudentId: uint(parsedID),
			})
		}
		if len(participations) > 0 {
			if err := tx.Create(&participations).Error; err != nil {
				return fmt.Errorf("failed to create participations: %w", err)
			}
		}

		return nil
	})

	if err != nil {
		return usecasemodels.ProjectInRepository{}, err
	}
	return usecasemodels.ProjectInRepository{
		Project: dbProject.MapToEntity(project.StudentIds),
	}, nil
}

func (r *ProjectRepository) AssignDriveFolder(project usecasemodels.DriveProject) error {
	dbCloudFolder := models.CloudFolder{}
	dbCloudFolder.MapUseCaseModelToThis(project.DriveFolder)

	err := r.dbContext.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(
			"INSERT INTO cloud_folder (id, link) VALUES (?, ?)",
			project.DriveFolder.Id,
			project.DriveFolder.Link,
		).Error; err != nil {
			return err
		}

		// Получаем последний ID
		var lastID uint
		if err := tx.Raw("SELECT LAST_INSERT_ID()").Scan(&lastID).Error; err != nil {
			return err
		}

		return tx.Model(&models.Project{}).
			Where("id = ?", project.Project.Id).
			Update("cloud_id", lastID).Error
	})

	return err
}

func (r *ProjectRepository) GetProjectCloudFolderId(projId string) (uint, error) {
	proj := models.Project{}
	result := r.dbContext.DB.Select("cloud_id").
		Where("id = ?", projId).
		Take(&proj)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return 0, usecasemodels.ErrProjectNotFound
		}
		return 0, result.Error
	}

	if !proj.CloudId.Valid {
		return 0, usecasemodels.ErrProjectCloudFolderNotFound
	}

	return uint(proj.CloudId.Int64), nil
}

func (r *ProjectRepository) GetProjectCloudFolderID(projId string) (string, error) {
	id, err := r.GetProjectCloudFolderId(projId)

	if err != nil {
		return "", err
	}

	folder := models.CloudFolder{}
	result := r.dbContext.DB.Select("id").
		Where("primary_key = ?", id).
		Take(&folder)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return "", usecasemodels.ErrProjectCloudFolderLinkNotFound
		}
		return "", result.Error
	}
	return folder.Id, nil
}

func (r *ProjectRepository) GetProjectFolderLink(projId string) (string, error) {
	folder := models.CloudFolder{}
	folderId, err := r.GetProjectCloudFolderId(projId)
	if err != nil {
		return "", err
	}

	result := r.dbContext.DB.Select("link").
		Where("primary_key = ?", folderId).
		Take(&folder)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return "", usecasemodels.ErrProjectCloudFolderLinkNotFound
		}
		return "", result.Error
	}
	return folder.Link, nil
}

func (r *ProjectRepository) GetStudentCurrentProject(studId string) (entities.Project, error) {
	proj := models.Project{}
	result := r.dbContext.DB.Select("*").Where("student_id = ? AND status_id IN(?, ?)",
		studId, entities.ProjectInProgress,
		entities.ProjectNotConfirmed).Order("year desc").Take(&proj)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return entities.Project{}, usecasemodels.ErrStudentHasNoCurrentProject
		}
		return entities.Project{}, result.Error
	}

	var participations []models.ProjectParticipation
	res := r.dbContext.DB.Select("id").Where("project_id = ?", proj.Id).Find(&participations)
	if res.Error != nil {
		return entities.Project{}, result.Error
	}
	var studentIds []string
	for _, p := range participations {
		studentIds = append(studentIds, strconv.FormatUint(uint64(p.StudentId), 10))
	}

	return proj.MapToEntity(studentIds), nil
}

func (r *ProjectRepository) GetProjectGradingById(projId string) (entities.ProjectGrading, error) {
	var defenceGrade sql.NullFloat64

	result := r.dbContext.DB.Model(models.Project{}).Select("defence_grade").Where("id=?", projId).Take(&defenceGrade)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return entities.ProjectGrading{}, usecasemodels.ErrProjectNotFound
		}
		return entities.ProjectGrading{}, result.Error
	}

	var supReview models.SupervisorReview
	result = r.dbContext.DB.Model(models.Project{}).Select("supervisor_review_id").Where("id=?", projId).Take(&supReview.Id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return entities.ProjectGrading{}, usecasemodels.ErrProjectNotFound
		}
		return entities.ProjectGrading{}, result.Error
	}

	grading := entities.ProjectGrading{
		ProjectId: projId,
	}
	if defenceGrade.Valid {
		grading.DefenceGrade = float32(defenceGrade.Float64)
	}
	if supReview.Id.Valid {
		result = r.dbContext.DB.Select("*").Where("id=?", supReview.Id).Take(&supReview)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return entities.ProjectGrading{}, usecasemodels.ErrSupervisorReviewNotFound
			}
			return entities.ProjectGrading{}, result.Error
		}

		var dbcriterias []models.ReviewCriteria
		r.dbContext.DB.Select("*").Where("supervisor_review_id=?", supReview.Id).Find(&dbcriterias)

		criterias := []entities.Criteria{}
		for _, c := range dbcriterias {
			criterias = append(criterias, c.MapToEntity())
		}
		grading.SupervisorReview = supReview.MapToEntity(criterias)
	}
	return grading, nil
}

func (r *ProjectRepository) GetProjectTaskInfoById(projId string) (usecasemodels.TasksInfo, error) {
	taskInfo := models.ProjectTaskInfo{}

	result := r.dbContext.DB.Raw(` 
	SELECT status, COUNT(status) as count
	FROM task
	WHERE project_id = ?
	GROUP BY status`, projId).Scan(&taskInfo.Statuses)
	if result.Error != nil {
		return usecasemodels.TasksInfo{}, result.Error
	}

	return taskInfo.MapToUseCaseModel(), nil
}

func (r *ProjectRepository) GetProjectMeetingInfoById(projId string) (usecasemodels.MeetingInfo, error) {
	var meetCount int

	result := r.dbContext.DB.Raw(`
	SELECT COUNT(id) as count
	FROM project_meeting
	WHERE project_id = ?`, projId).Scan(&meetCount)
	if result.Error != nil {
		return usecasemodels.MeetingInfo{}, result.Error
	}

	return usecasemodels.MeetingInfo{
		PassedCount: meetCount,
	}, nil
}

func (r *ProjectRepository) UpdateProject(proj entities.Project) error {
	projDb := models.Project{}
	result := r.dbContext.DB.Where("id = ?", proj.Id).Find(&projDb)
	if result.Error != nil {
		return result.Error
	}
	projDb.MapEntityToThis(proj)

	result = r.dbContext.DB.Where("id = ?", proj.Id).Save(&projDb)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (r *ProjectRepository) UpdateProjectDefenceGrade(projId string, grade float32) error {
	result := r.dbContext.DB.Model(&models.Project{}).Where("id = ?", projId).Update("defence_grade", grade)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (r *ProjectRepository) UpdateProjectSupRew(projId string, sr entities.SupervisorReview) error {
	srDb := models.SupervisorReview{}
	srDb.MapEntityToThis(sr)

	err := r.dbContext.DB.Transaction(func(tx *gorm.DB) error {
		result := tx.Save(&srDb)
		if result.Error != nil {
			return result.Error
		}

		result = tx.Where("supervisor_review_id = ?", srDb.Id.Int64).Delete(&models.ReviewCriteria{})
		if result.Error != nil {
			return result.Error
		}

		for _, c := range sr.Criterias {
			cDb := models.ReviewCriteria{}
			cDb.MapEntityToThis(c)
			cDb.SupervieorReviewId = uint(srDb.Id.Int64)

			result = tx.Create(&cDb)
			if result.Error != nil {
				return result.Error
			}
		}

		result = tx.Model(&models.Project{}).Where("id = ?", projId).Update("supervisor_review_id", srDb.Id.Int64)
		if result.Error != nil {
			return result.Error
		}
		return nil
	})

	if err != nil {
		return err
	}
	return nil
}
