ssh ubuntu@app1.phx.domo "/snap/bin/microk8s.kubectl delete deployment multitracker-deployment"
ssh ubuntu@app1.phx.domo "/snap/bin/microk8s.kubectl delete ingress multitracker-ingress"
ssh ubuntu@app1.phx.domo "/snap/bin/microk8s.kubectl delete svc multitracker"
