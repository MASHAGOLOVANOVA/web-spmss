package clouddrive

import (
	"encoding/base64"
	"fmt"
	entities "mvp-2-spms/domain-aggregate"
	"mvp-2-spms/services/models"

	"golang.org/x/oauth2"
)

type GoogleDrive struct {
	api googleDriveApi
}

func InitGoogleDrive(api googleDriveApi) *GoogleDrive {
	return &GoogleDrive{api: api}
}

func (d *GoogleDrive) AddProjectFolder(project entities.Project, driveInfo models.CloudDriveIntegration) (models.DriveProject, error) {
	folderName := fmt.Sprint("Project ", project.Id, "_", project.Theme)
	folder, err := d.api.CreateFolder(folderName, driveInfo.BaseFolderId)
	if err != nil {
		return models.DriveProject{}, err
	}
	return models.DriveProject{
		Project: project,
		DriveFolder: models.DriveFolder{
			Id:   folder.Id,
			Link: folder.WebViewLink,
		},
	}, nil
}

func (d *GoogleDrive) DeleteFolder(folderId string, driveInfo models.CloudDriveIntegration) error {
	err := d.api.DeleteFolder(folderId, driveInfo)
	if err != nil {
		return fmt.Errorf("failed to delete project folder: %v", err)
	}
	return nil
}

func (d *GoogleDrive) AddProfessorBaseFolder() (models.DriveData, error) {
	folderName := "Student Project Management System Project Folder"

	existingFolders, err := d.api.GetFoldersByName(folderName)
	if err != nil {
		return models.DriveData{}, err
	}

	count := 0
	for len(existingFolders.Files) != 0 {
		count++
		folderNameCopy := fmt.Sprint(folderName, " (", count, ")")
		existingFolders, err = d.api.GetFoldersByName(folderNameCopy)
		if err != nil {
			return models.DriveData{}, err
		}
	}

	folder, err := d.api.CreateFolder(fmt.Sprint(folderName, " (", count, ")"))
	if err != nil {
		return models.DriveData{}, err
	}

	return models.DriveData{
		BaseFolderId: folder.Id,
	}, nil
}

func (d *GoogleDrive) GetFolderNameById(id string) (string, error) {
	folder, err := d.api.GetFolderById(id)
	if err != nil {
		return "", err
	}
	return folder.Name, nil
}

func (d *GoogleDrive) AddTaskToDrive(task entities.Task, projectFolderId string) (models.DriveTask, error) {
	// add task folder
	folderName := fmt.Sprint("Task ", task.Id, "_", task.Name, " until: ", task.Deadline.Format("02.01.2006"))

	folder, err := d.api.CreateFolder(folderName, projectFolderId)
	if err != nil {
		return models.DriveTask{}, err
	}

	// add task file
	fileName := fmt.Sprint("Task '", task.Name, "' desctiprion")
	text := fmt.Sprint(task.Name, "\n\n", task.Description)

	file, err := d.api.AddTextFileToFolder(fileName, text, folder.Id)
	if err != nil {
		return models.DriveTask{}, err
	}

	return models.DriveTask{
		Task: task,
		DriveFolder: models.DriveFolder{
			Id:   folder.Id,
			Link: folder.WebViewLink,
		},
		TaskFileId: file.Id,
	}, nil
}
func (d *GoogleDrive) GetAuthLink(redirectURI string, accountId int, returnURL string) (string, error) {
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// encode as JSON!
	statestr := base64.URLEncoding.EncodeToString([]byte(fmt.Sprint(accountId, ",", returnURL)))

	url, err := d.api.GetAuthLink(redirectURI, statestr)
	if err != nil {
		return "", err
	}

	return url, nil
}

func (d *GoogleDrive) GetToken(code string) (*oauth2.Token, error) {
	token, err := d.api.GetToken(code)
	if err != nil {
		return nil, err
	}
	return token, nil
}

func (d *GoogleDrive) Authentificate(token *oauth2.Token) error {
	err := d.api.AuthentificateService(token)
	if err != nil {
		return err
	}
	return nil
}
