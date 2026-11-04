// Если крадёте, то крадите ради реально хороших людей
package main

import (
	"embed"
	"io/fs"
	"mime"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"strings"
	"sync/atomic"
	"time"
)

//go:embed all:dist
var site embed.FS

const port = "47615"

const heartbeat = `<script>setInterval(function(){fetch('/__alive',{cache:'no-store'}).catch(function(){})},4000);fetch('/__alive');</script>`

func open(url string) {
	switch runtime.GOOS {
	case "windows":
		exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		exec.Command("open", url).Start()
	default:
		exec.Command("xdg-open", url).Start()
	}
}

func main() {
	for ext, t := range map[string]string{".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ttf": "font/ttf", ".woff2": "font/woff2"} {
		mime.AddExtensionType(ext, t)
	}
	url := "http://127.0.0.1:" + port + "/"
	ln, err := net.Listen("tcp", "127.0.0.1:"+port)
	if err != nil {
		open(url)
		return
	}
	root, _ := fs.Sub(site, "dist")
	files := http.FileServer(http.FS(root))
	index, _ := fs.ReadFile(root, "index.html")
	page := []byte(strings.Replace(string(index), "</body>", heartbeat+"</body>", 1))

	var last atomic.Int64
	last.Store(time.Now().Unix())
	var seen atomic.Bool

	mux := http.NewServeMux()
	mux.HandleFunc("/__alive", func(w http.ResponseWriter, r *http.Request) {
		last.Store(time.Now().Unix())
		seen.Store(true)
		w.WriteHeader(http.StatusNoContent)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || r.URL.Path == "/index.html" {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-store")
			w.Write(page)
			return
		}
		files.ServeHTTP(w, r)
	})

	go func() {
		for range time.Tick(5 * time.Second) {
			idle := time.Now().Unix() - last.Load()
			if (seen.Load() && idle > 150) || (!seen.Load() && idle > 300) {
				ln.Close()
				return
			}
		}
	}()

	open(url)
	http.Serve(ln, mux)
}
