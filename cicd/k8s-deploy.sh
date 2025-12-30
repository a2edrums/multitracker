
NEW_DOCKER_IMAGE_VERSION=$(cat cicd/current_deployed_version.txt)
echo $NEW_DOCKER_IMAGE_VERSION

OUTPUT_FILE_NAME="multitracker.yaml"

cat  cicd/config/k8s/deployment.yaml | sed 's/IMAGE_VERSION/'$NEW_DOCKER_IMAGE_VERSION'/' >> $OUTPUT_FILE_NAME
echo "\n---" >> $OUTPUT_FILE_NAME
cat  cicd/config/k8s/service.yaml >> $OUTPUT_FILE_NAME
echo "\n---" >> $OUTPUT_FILE_NAME
cat  cicd/config/k8s/ingress.yaml >> $OUTPUT_FILE_NAME

scp $OUTPUT_FILE_NAME rpi@app1.flg.domo:/home/rpi/$OUTPUT_FILE_NAME

rm $OUTPUT_FILE_NAME

REMOTE_DEPLOY_COMMAND="/snap/bin/microk8s.kubectl create -f /home/rpi/$OUTPUT_FILE_NAME"
echo $REMOTE_DEPLOY_COMMAND
ssh rpi@app1.flg.domo $REMOTE_DEPLOY_COMMAND
