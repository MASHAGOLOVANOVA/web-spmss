package taskrepository

import (
	"errors"
	"mvp-2-spms/database"
	"mvp-2-spms/database/models"
	entities "mvp-2-spms/domain-aggregate"
	usecasemodels "mvp-2-spms/services/models"

	"gorm.io/gorm"
)

type TaskRepository struct {
	dbContext database.Database
}

func InitTaskRepository(dbcxt database.Database) *TaskRepository {
	return &TaskRepository{
		dbContext: dbcxt,
	}
}

func (r *TaskRepository) CreateTask(task entities.Task) (entities.Task, error) {
	dbtask := models.Task{}
	dbtask.MapEntityToThis(task)

	result := r.dbContext.DB.Create(&dbtask)
	if result.Error != nil {
		return entities.Task{}, result.Error
	}

	return dbtask.MapToEntity(), nil
}

func (r *TaskRepository) DeleteTask(taskId int) error {
	dbtask := models.Task{Id: uint(taskId)}

	result := r.dbContext.DB.Delete(&dbtask)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (r *TaskRepository) AssignDriveTask(task usecasemodels.DriveTask) error {
	dbCloudFolder := models.CloudFolder{}
	dbCloudFolder.MapUseCaseModelToThis(task.DriveFolder)

	err := r.dbContext.DB.Transaction(func(tx *gorm.DB) error {
		result := tx.Create(&dbCloudFolder)
		if result.Error != nil {
			return result.Error
		}

		result = tx.Model(&models.Task{}).Select("folder_id", "task_file_id").Where("id = ?", task.Task.Id).Updates(
			models.Task{
				FolderId:   task.DriveFolder.Id,
				TaskFileId: task.TaskFileId,
			})

		if result.Error != nil {
			return result.Error
		}
		// таска с таким id не найдена, отмена транзакции
		if result.RowsAffected == 0 {
			return usecasemodels.ErrTaskNotFound
		}
		return nil
	})

	return err
}

func (r *TaskRepository) GetProjectTasks(projId string) ([]entities.Task, error) {
	var tasksDb []models.Task

	result := r.dbContext.DB.Select("*").Where("project_id = ?", projId).Find(&tasksDb)
	if result.Error != nil {
		return []entities.Task{}, result.Error
	}

	tasks := []entities.Task{}
	for _, t := range tasksDb {
		tasks = append(tasks, t.MapToEntity())
	}

	return tasks, nil
}

func (r *TaskRepository) GetTaskById(taskId string) (entities.Task, error) {
	var dbTask models.Task

	result := r.dbContext.DB.Select("*").Where("id = ?", taskId).Take(&dbTask)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return entities.Task{}, usecasemodels.ErrStudentHasNoCurrentProject
		}
		return entities.Task{}, result.Error
	}

	return dbTask.MapToEntity(), nil
}

func (r *TaskRepository) GetProjectTasksWithCloud(projId string) ([]usecasemodels.DriveTask, error) {
	joinedResults := []struct {
		models.Task
		models.CloudFolder
	}{}

	result := r.dbContext.DB.Model(models.Task{}).Select("*").Joins("left join cloud_folder on cloud_folder.id=task.folder_id").Where("project_id = ?", projId).Find(&joinedResults)
	if result.Error != nil {
		return []usecasemodels.DriveTask{}, result.Error
	}

	driveTasks := []usecasemodels.DriveTask{}
	for _, t := range joinedResults {
		driveTasks = append(driveTasks,
			usecasemodels.DriveTask{
				Task:        t.Task.MapToEntity(),
				DriveFolder: t.CloudFolder.MapToUseCaseModel(),
			},
		)
	}

	return driveTasks, nil
}

func (r *TaskRepository) UpdateTask(task entities.Task) error {
	taskDb := models.Task{}
	result := r.dbContext.DB.Where("id = ?", task.Id).Take(&taskDb)
	if result.Error != nil {
		return result.Error
	}
	taskDb.MapEntityToThis(task)

	result = r.dbContext.DB.Where("id = ?", task.Id).Save(&taskDb)
	if result.Error != nil {
		return result.Error
	}

	return nil
}
