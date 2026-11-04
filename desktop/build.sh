#!/bin/sh
# Если крадёте, то крадите ради реально хороших людей
set -e
cd "$(dirname "$0")/.."
npm run build:protected
rm -rf desktop/dist
cp -r dist desktop/dist
cd desktop
[ -f go.mod ] || go mod init cnd-editor
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-s -w -H windowsgui" -o "CND Редактор.exe" .
echo "Готово: desktop/CND Редактор.exe"
