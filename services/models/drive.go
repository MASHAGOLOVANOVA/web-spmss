package models

import (
	entities "mvp-2-spms/domain-aggregate"
)

type DriveData struct {
	BaseFolderId string
}

type DriveProject struct {
	entities.Project
	DriveFolder
}

type DriveTask struct {
	entities.Task
	DriveFolder
	TaskFileId string
}

type DriveFolder struct {
	Id   string
	Link string
}
