package outputdata

import (
	entities "mvp-2-spms/domain-aggregate"
	"mvp-2-spms/services/models"
	"time"
)

type GetProjectCommits struct {
	Commits []getProjCommCommitData `json:"commits"`
}

func MapToGetProjectCommits(commits []models.Commit) GetProjectCommits {
	outputCommits := []getProjCommCommitData{}
	for _, commit := range commits {
		outputCommits = append(outputCommits,
			getProjCommCommitData{
				SHA:     commit.SHA,
				Message: commit.Description,
				Date:    commit.Date,
				Creator: commit.Author,
			})
	}
	return GetProjectCommits{
		Commits: outputCommits,
	}
}

type GetProjectCommitsEntities struct {
	Project entities.Project
	Student entities.Student
}

type getProjCommCommitData struct {
	SHA     string    `json:"commit_sha"`
	Message string    `json:"message"`
	Date    time.Time `json:"date_created"`
	Creator string    `json:"created_by"`
}
