@echo off
echo Restaurando Dockerfiles...
copy /Y "api-festivos\Dockerfile.txt" "api-festivos\Dockerfile"
copy /Y "api-calendario\Dockerfile.txt" "api-calendario\Dockerfile"
copy /Y "Dockerfile.txt" "Dockerfile"
echo Dockerfiles restaurados con exito!
pause
