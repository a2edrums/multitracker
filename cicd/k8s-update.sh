
NEW_DOCKER_IMAGE_VERSION=$(cat cicd/current_deployed_version.txt)
echo $NEW_DOCKER_IMAGE_VERSION
REMOTE_DEPLOY_COMMAND="/snap/bin/microk8s.kubectl set image deployment multitracker-deployment multitracker=matt404/multitracker:"$NEW_DOCKER_IMAGE_VERSION
echo $REMOTE_DEPLOY_COMMAND
ssh rpi@app1.flg.domo $REMOTE_DEPLOY_COMMAND
