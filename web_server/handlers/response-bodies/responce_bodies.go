package responsebodies

import "time"

type SessionToken struct {
	Token  string    `json:"session_token"`
	Expiry time.Time `json:"expires_at"`
}

type ProjectStatuses struct {
	Statuses []Status `json:"statuses"`
}

type ProjectStages struct {
	Stages []Status `json:"stages"`
}

type TaskStatuses struct {
	Statuses []Status `json:"statuses"`
}

type MeetingStatuses struct {
	Statuses []Status `json:"statuses"`
}

type Status struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
}
