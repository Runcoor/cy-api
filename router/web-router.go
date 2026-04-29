package router

import (
	"embed"
	"net/http"
	"path"
	"strings"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/controller"
	"github.com/runcoor/aggre-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

// staticAssetExts are extensions whose missing files should 404 cleanly
// instead of falling back to the SPA's index.html. Cloudflare (and any
// CDN with cache-everything rules) will happily memoize the HTML body
// with `content-type: text/html` against an asset URL, and the browser
// then renders a blank/broken element forever — which is exactly the
// failure mode we hit when a fresh image URL was requested before the
// underlying file landed in the embedded FS. Returning a real 404 keeps
// the cache layer honest.
var staticAssetExts = map[string]struct{}{
	".png": {}, ".jpg": {}, ".jpeg": {}, ".gif": {}, ".webp": {},
	".svg": {}, ".ico": {}, ".bmp": {}, ".avif": {},
	".css": {}, ".js": {}, ".mjs": {}, ".map": {},
	".woff": {}, ".woff2": {}, ".ttf": {}, ".otf": {}, ".eot": {},
	".json": {}, ".txt": {}, ".xml": {}, ".webmanifest": {},
	".mp4": {}, ".webm": {}, ".mp3": {}, ".wav": {}, ".pdf": {},
}

func looksLikeStaticAsset(reqURI string) bool {
	// Strip query/fragment, then test by extension.
	if i := strings.IndexAny(reqURI, "?#"); i >= 0 {
		reqURI = reqURI[:i]
	}
	ext := strings.ToLower(path.Ext(reqURI))
	if ext == "" {
		return false
	}
	_, ok := staticAssetExts[ext]
	return ok
}

func SetWebRouter(router *gin.Engine, buildFS embed.FS, indexPage []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(static.Serve("/", common.EmbedFolder(buildFS, "web/dist")))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		if looksLikeStaticAsset(c.Request.RequestURI) {
			c.Header("Cache-Control", "no-store")
			c.Status(http.StatusNotFound)
			return
		}
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
}
