package outputdata

import (
	entities "mvp-2-spms/domain-aggregate"
	"strconv"
)

type AddTask struct {
	Id int `json:"task_id"`
}

func MapToAddTask(task entities.Task) AddTask {
	sId, _ := strconv.Atoi(task.Id)
	return AddTask{
		Id: sId,
	}
}
