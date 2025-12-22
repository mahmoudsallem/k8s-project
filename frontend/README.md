# Frontend Docker Build Instructions

## Build the Docker image:
```bash
docker build -t frontend:latest ./frontend
```

## Run the container locally:
```bash
docker run -p 8080:80 frontend:latest
```

Then visit `http://localhost:8080` in your browser.

## Push to Docker registry:
```bash
# Tag the image
docker tag frontend:latest your-registry/frontend:latest

# Push to registry
docker push your-registry/frontend:latest
```

## Deploy to Kubernetes:
Update the frontend deployment to use the image:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-app
  namespace: forntend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

Then apply it:
```bash
kubectl apply -f frontend-deployment.yaml
```
