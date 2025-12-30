ssh rpi@app1.flg.domo "/snap/bin/microk8s.kubectl delete deployment multitracker-deployment"
ssh rpi@app1.flg.domo "/snap/bin/microk8s.kubectl delete ingress multitracker-ingress"
ssh rpi@app1.flg.domo "/snap/bin/microk8s.kubectl delete svc multitracker"
