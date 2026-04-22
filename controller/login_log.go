package controller

import (
	"strconv"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"

	"github.com/gin-gonic/gin"
)

func GetAllLoginLogs(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)

	userId, _ := strconv.Atoi(c.Query("user_id"))
	username := c.Query("username")
	loginType := c.Query("login_type")
	loginIp := c.Query("login_ip")

	logs, total, err := model.GetAllLoginLogs(
		pageInfo.GetStartIdx(), pageInfo.GetPageSize(),
		userId, username, loginType, loginIp,
	)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(logs)
	common.ApiSuccess(c, pageInfo)
}
