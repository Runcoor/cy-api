package service

import (
	"strings"

	"github.com/QuantumNous/aggre-api/constant"
)

func CoverTaskActionToModelName(platform constant.TaskPlatform, action string) string {
	return strings.ToLower(string(platform)) + "_" + strings.ToLower(action)
}
