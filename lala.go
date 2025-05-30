package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/yandex"
	"io"
	"log"
	"net/http"
	"net/url"
)

// Конфигурация OAuth2
var yandexOAuthConfig = &oauth2.Config{
	ClientID:     "33663435c31443af933742df94b2516f",
	ClientSecret: "2d9259feb4f8400bbc6511b1c0d8d9b3",
	RedirectURL:  "http://localhost:8080/callback",
	Scopes:       []string{"login:email", "cloud_api:disk.read", "cloud_api:disk.info", "cloud_api:disk.write", "cloud_api:disk.app_folder"},
	Endpoint:     yandex.Endpoint,
}

// Структуры для разбора ответов API
type DiskResponse struct {
	Embedded struct {
		Items []struct {
			Name string `json:"name"`
			Type string `json:"type"`
		} `json:"items"`
	} `json:"_embedded"`
}

func main1() {
	http.HandleFunc("/", handleMain)
	http.HandleFunc("/login", handleYandexLogin)
	http.HandleFunc("/callback", handleYandexCallback)

	fmt.Println("Server started at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleMain(w http.ResponseWriter, r *http.Request) {
	var html = `<html><body>
		<a href="/login">Login with Yandex</a>
	</body></html>`
	fmt.Fprintf(w, html)
}

func handleYandexLogin(w http.ResponseWriter, r *http.Request) {
	state := generateState()
	url := yandexOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func generateState() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		log.Fatal(err)
	}
	return base64.StdEncoding.EncodeToString(b)
}
func handleYandexCallback(w http.ResponseWriter, r *http.Request) {
	code := r.FormValue("code")
	if code == "" {
		http.Error(w, "Code not found", http.StatusBadRequest)
		return
	}

	token, err := yandexOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, fmt.Sprintf("Token exchange failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Создаем клиент вручную с использованием токена
	client := &http.Client{}

	// Создаем папку на диске
	err = createDiskFolder(client, token, "/new_folde1r")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create folder: %v", err), http.StatusInternalServerError)
		return
	}

	// Получаем список папок (передаём весь client, а не только токен)
	diskInfo, err := getDiskFolders(client, token)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get disk info: %v", err), http.StatusInternalServerError)
		return
	}

	// Вывод результатов
	fmt.Fprintf(w, "<h1>Disk Folders</h1><ul>")
	for _, item := range diskInfo.Embedded.Items {
		if item.Type == "dir" {
			fmt.Fprintf(w, "<li>%s</li>", item.Name)
		}
	}
	fmt.Fprintf(w, "</ul>")
}

func getDiskFolders(client *http.Client, token *oauth2.Token) (*DiskResponse, error) {
	req, err := http.NewRequest("GET", "https://cloud-api.yandex.net/v1/disk/resources?path=/&limit=100", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Добавляем заголовок авторизации вручную
	req.Header.Set("Authorization", "OAuth "+token.AccessToken)

	// Логирование для отладки
	fmt.Printf("Making request to: %s\n", req.URL)
	fmt.Printf("Authorization header: %s\n", req.Header.Get("Authorization"))
	fmt.Printf("Access Token: %s\n", token.AccessToken)

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Full error response (%d): %s\n", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("API error: %s, response: %s", resp.Status, string(bodyBytes))
	}

	var result DiskResponse
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w, body: %s", err, string(bodyBytes))
	}

	return &result, nil
}

func createDiskFolder(client *http.Client, token *oauth2.Token, folderPath string) error {
	// Формируем URL для создания папки
	url := "https://cloud-api.yandex.net/v1/disk/resources?path=" + url.QueryEscape(folderPath)

	// Создаем новый запрос
	req, err := http.NewRequest("PUT", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Добавляем заголовок авторизации вручную
	req.Header.Set("Authorization", "OAuth "+token.AccessToken)

	// Логирование для отладки
	fmt.Printf("Making request to: %s\n", req.URL)
	fmt.Printf("Authorization header: %s\n", req.Header.Get("Authorization"))
	fmt.Printf("Access Token: %s\n", token.AccessToken)

	// Выполняем запрос
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Читаем тело ответа
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	// Проверяем статус ответа
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		fmt.Printf("Full error response (%d): %s\n", resp.StatusCode, string(bodyBytes))
		return fmt.Errorf("API error: %s, response: %s", resp.Status, string(bodyBytes))
	}

	// Логирование успешного ответа
	fmt.Printf("Folder created successfully: %s\n", string(bodyBytes))

	return nil
}

func uploadFileToDisk(client *http.Client, token *oauth2.Token, filePath string, file io.Reader) error {
	// Формируем URL для загрузки файла
	url := "https://cloud-api.yandex.net/v1/disk/resources/upload?path=" + url.QueryEscape(filePath) + "&overwrite=true"

	// Создаем новый запрос для получения ссылки на загрузку
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Добавляем заголовок авторизации
	req.Header.Set("Authorization", "OAuth "+token.AccessToken)

	// Выполняем запрос
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Читаем тело ответа
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	// Проверяем статус ответа
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API error: %s, response: %s", resp.Status, string(bodyBytes))
	}

	// Парсим URL для загрузки
	var uploadInfo struct {
		Href string `json:"href"`
	}
	if err := json.Unmarshal(bodyBytes, &uploadInfo); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	// Загружаем файл
	req, err = http.NewRequest("PUT", uploadInfo.Href, file)
	if err != nil {
		return fmt.Errorf("failed to create upload request: %w", err)
	}

	// Добавляем заголовок авторизации
	req.Header.Set("Authorization", "OAuth "+token.AccessToken)

	// Выполняем запрос на загрузку файла
	resp, err = client.Do(req)
	if err != nil {
		return fmt.Errorf("upload request failed: %w", err)
	}
	defer resp.Body.Close()

	// Проверяем статус ответа
	if resp.StatusCode != http.StatusCreated {
		bodyBytes, _ = io.ReadAll(resp.Body) // ignore error for simplicity
		return fmt.Errorf("upload error: %s, response: %s", resp.Status, string(bodyBytes))
	}

	// Логирование успешной загрузки
	fmt.Printf("File uploaded successfully to: %s\n", filePath)
	return nil
}
