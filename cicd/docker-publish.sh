npm run build

# builds for ARMv8 using dockerx, and pushes to cloud account
NEW_DOCKER_IMAGE_VERSION=$(date +%s)
echo "$NEW_DOCKER_IMAGE_VERSION" > cicd/current_deployed_version.txt

docker buildx build --platform linux/arm64/v8 --push -t matt404/multitracker:$NEW_DOCKER_IMAGE_VERSION .

