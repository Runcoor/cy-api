// Package geoip provides optional IP -> country lookup backed by a MaxMind
// MMDB file (GeoLite2-Country, GeoLite2-City, or DB-IP equivalents).
//
// The reader is initialized lazily from the GEOIP_DB_PATH environment variable
// at first use. If the variable is unset or the file cannot be opened the
// package degrades gracefully — every lookup returns an empty string.
package geoip

import (
	"net"
	"os"
	"sync"

	"github.com/oschwald/geoip2-golang"

	"github.com/runcoor/aggre-api/common"
)

var (
	reader   *geoip2.Reader
	initOnce sync.Once
)

// Available reports whether a GeoIP database is loaded and ready.
func Available() bool {
	initOnce.Do(load)
	return reader != nil
}

// Country returns the ISO 3166-1 alpha-2 country code (e.g. "US", "CN") for
// the given IP, or an empty string if the database is not configured, the IP
// is invalid, or no record is found.
func Country(ip string) string {
	initOnce.Do(load)
	if reader == nil || ip == "" {
		return ""
	}
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return ""
	}
	rec, err := reader.Country(parsed)
	if err != nil {
		return ""
	}
	return rec.Country.IsoCode
}

func load() {
	path := os.Getenv("GEOIP_DB_PATH")
	if path == "" {
		return
	}
	if _, err := os.Stat(path); err != nil {
		common.SysError("geoip: database not accessible at " + path + ": " + err.Error())
		return
	}
	r, err := geoip2.Open(path)
	if err != nil {
		common.SysError("geoip: failed to open database: " + err.Error())
		return
	}
	reader = r
	common.SysLog("geoip: loaded database from " + path)
}
