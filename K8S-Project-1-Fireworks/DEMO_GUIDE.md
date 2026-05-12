# Fireworks App: Kubernetes Deployment Guide (Minikube)

This guide provides the exact commands and steps to deploy the **Firecrackers Celebration** portal to a local Kubernetes cluster using Minikube.

## 📋 Prerequisites
1.  **Docker Desktop**: Must be installed and running.
2.  **Minikube**: Installed (`minikube version`).
3.  **Kubectl**: Installed (`kubectl version --client`).

---

## 🚀 Step-by-Step Execution

### 1. Start Minikube
Initialize your local Kubernetes cluster.
```powershell
minikube start
```

### 2. Configure Docker Environment
Point your shell to Minikube's internal Docker daemon. This allows you to build images that Minikube can see without pushing to a registry.
```powershell
# For PowerShell:
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# For Command Prompt:
# minikube docker-env | @for /f "tokens=*" %i in ('stdin') do @%i
```

### 3. Build the Application Image
Navigate to the `K8S-Project-1-Fireworks` directory and build the Docker image.
```powershell
docker build -t fireworks-app:latest .
```
### 3.Method 1 (BEST): Load image into Minikube

minikube image load fireworks-app:latest

### 4. Deploy Kubernetes Manifests
Apply all the configuration files (Secret, ConfigMap, PVC, Deployment, Service) at once.
```powershell
kubectl apply -f k8s/
```

### 5. Verify Pod Status
Wait for all pods to be in the `Running` and `Ready (1/1)` state.
```powershell
kubectl get pods
```

### 6. Access the Application
Generate the URL to open the portal in your browser.
```powershell
minikube service fireworks-service
```
*Note: Keep this terminal open to maintain the tunnel!*

---

## 🛠️ Useful Debugging Commands

### View Logs
If the app is not working, check the logs of the application pod:
```powershell
kubectl logs -l app=fireworks-app
```

### Restart the App (After Code Changes)
If you update your HTML/JS code, follow these steps to see the changes:
1. Rebuild the image: `docker build -t fireworks-app:latest .`
2. Restart the pods: `kubectl rollout restart deployment fireworks-app`

### Check Database Connection
```powershell
kubectl logs -l app=mysql
```
---

## 👨‍💻 Credits
**Developed by Chanakya Reddy**  
*Fireworks Composer Project - 2026*
