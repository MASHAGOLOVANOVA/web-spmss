package clouddrive

import (
	"errors"
	"fmt"
	"log"
	googleapi "mvp-2-spms/integrations/google-api"
	"mvp-2-spms/services/models"
	"net/url"
	"strings"

	"golang.org/x/oauth2"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

const DAYS_PERIOD = 7
const HOURS_IN_DAY = 24
const EVENT_DURATION_HOURS = 1

type googleDriveApi struct {
	googleapi.Google
	api *drive.Service
}

func InitDriveApi(googleAPI googleapi.GoogleAPI) googleDriveApi {
	d := googleDriveApi{
		Google: googleapi.InintGoogle(googleAPI),
	}
	return d
}

func (d *googleDriveApi) AuthentificateService(token *oauth2.Token) error {
	if err := d.Authentificate(token); err != nil {
		log.Printf("Ошибка при аутентификации CloudDrive: %v", err)
	}

	api, err := drive.NewService(d.GetContext(), option.WithHTTPClient(d.GetClient()))
	if err != nil {
		return err
	}

	d.api = api
	return nil
}

func (d *googleDriveApi) CreateFolder(folderName string, parentFolder ...string) (*drive.File, error) {
	fileMetadata := &drive.File{
		Name:     folderName,
		MimeType: "application/vnd.google-apps.folder",
		Parents:  parentFolder,
	}
	file, err := d.api.Files.Create(fileMetadata).Fields("id", "webViewLink").Do()
	if err == nil {
		return file, nil
	}
	return nil, err
}

func (d *googleDriveApi) DeleteFolder(folderUrlOrId string, driveInfo models.CloudDriveIntegration) error {
	// Проверяем, что folderId не пустой
	if folderUrlOrId == "" {
		return errors.New("folderId cannot be empty")
	}

	// Извлекаем ID папки из URL (если передан URL)
	folderId := extractFolderId(folderUrlOrId)

	// Выполняем запрос на удаление
	err := d.api.Files.Delete(folderId).Do()
	if err != nil {
		return fmt.Errorf("failed to delete folder: %v", err)
	}
	return nil
}

// extractFolderId извлекает ID папки из URL Google Drive
func extractFolderId(urlOrId string) string {
	// Если это уже ID (нет слешей), возвращаем как есть
	if !strings.Contains(urlOrId, "/") {
		return urlOrId
	}

	// Разбираем URL
	u, err := url.Parse(urlOrId)
	if err != nil {
		return urlOrId // если не удалось распарсить, вернем как есть
	}

	// Для URL вида https://drive.google.com/drive/folders/{folderId}
	if strings.Contains(u.Path, "/folders/") {
		parts := strings.Split(u.Path, "/")
		for i, part := range parts {
			if part == "folders" && i+1 < len(parts) {
				return parts[i+1]
			}
		}
	}

	return urlOrId // если не нашли паттерн, вернем как есть
}
func (d *googleDriveApi) GetFolderById(folderId string) (*drive.File, error) {
	file, err := d.api.Files.Get(folderId).Fields("id", "webViewLink", "name").Do()
	if err == nil {
		return file, nil
	}
	return nil, err
}

func (d *googleDriveApi) GetFoldersByName(folderName string) (*drive.FileList, error) {
	file, err := d.api.Files.List().Q(fmt.Sprint("name='", folderName, "'")).Do()
	if err == nil {
		return file, nil
	}
	return nil, err
}

func (d *googleDriveApi) AddTextFileToFolder(fileName string, fileText string, parentFolderId string) (*drive.File, error) {
	fileMetadata := &drive.File{
		Name:     fileName,
		MimeType: "application/vnd.google-apps.document", // google document type
		Parents:  []string{parentFolderId},
	}

	r := strings.NewReader(fileText)
	file, err := d.api.Files.Create(fileMetadata).Media(r).Fields("id").Do()
	if err == nil {
		return file, nil
	}
	return nil, err
}
