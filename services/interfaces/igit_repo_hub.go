package interfaces

import (
	"mvp-2-spms/services/models"
	"time"
)

type IGitRepositoryHub interface {
	IIntegration
	GetRepositoryCommitsFromTime(repo models.Repository, fromTime time.Time) ([]models.Commit, error)
}
