# Full-Stack Kubernetes Application

A complete microservices application with Frontend, Backend API, and PostgreSQL database deployed on Kubernetes.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│                 http://localhost:8080                    │
└─────────────────────────┬───────────────────────────────┘
                          │ kubectl port-forward
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend (forntend namespace)               │
│              salem7ouda/frontend:v9                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │  NGINX serves: HTML, CSS, JS                       │ │
│  │  Proxies: /api/* → Backend                         │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │ Internal K8s network
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (backend namespace)                 │
│              salem7ouda/backend:v2                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Go + Gin Framework                                │ │
│  │  REST API on port 3000                             │ │
│  │  Endpoints: /health, /api/login, /api/users        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Database (db namespace)                   │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  PostgreSQL     │  │  Redis          │              │
│  │  postgres-0     │  │  redis-0        │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
k8s/
├── frontend/                    # Frontend application
│   ├── index.html              # Login page
│   ├── signup.html             # Signup page
│   ├── style.css               # Login styles
│   ├── signup.css              # Signup styles
│   ├── app.js                  # Login JavaScript
│   ├── signup.js               # Signup JavaScript
│   ├── nginx.conf              # NGINX config with API proxy
│   └── Dockerfile              # Frontend Docker build
│
├── backend/                     # Backend API
│   ├── main.go                 # Go API server
│   ├── go.mod                  # Go modules
│   ├── go.sum                  # Go dependencies
│   └── Dockerfile              # Backend Docker build
│
├── 01-config-secrets.yaml      # ConfigMaps and Secrets
├── 02-redis.yaml               # Redis StatefulSet
├── 03-database.yaml            # PostgreSQL StatefulSet
├── 04-frontend-service.yaml    # Frontend Service
├── 05-frontend-deployment.yaml # Frontend Deployment
├── 06-backend-deployment.yaml  # Backend Deployment & Service
├── 07-backend-hpa.yaml         # Horizontal Pod Autoscaler
└── README.md                   # This file
```

## 🐳 Docker Images

| Image | Version | Description |
|-------|---------|-------------|
| `salem7ouda/frontend` | v9 | NGINX + Login/Signup UI |
| `salem7ouda/backend` | v2 | Go REST API |
| `postgres` | 13-alpine | PostgreSQL Database |
| `redis` | alpine | Redis Cache |

## 🚀 Quick Start

### Prerequisites
- Kubernetes cluster (minikube, kind, or cloud)
- kubectl configured
- Docker (for building images)

### Deploy the Application

```bash
# Create namespaces
kubectl create namespace db
kubectl create namespace backend
kubectl create namespace forntend

# Deploy in order
kubectl apply -f 01-config-secrets.yaml
kubectl apply -f 02-redis.yaml
kubectl apply -f 03-database.yaml
kubectl apply -f 04-frontend-service.yaml
kubectl apply -f 05-frontend-deployment.yaml
kubectl apply -f 06-backend-deployment.yaml
kubectl apply -f 07-backend-hpa.yaml

# Wait for pods
kubectl get pods -n db -w
kubectl get pods -n backend -w
kubectl get pods -n forntend -w
```

### Access the Application

```bash
# Port forward frontend
kubectl port-forward -n forntend svc/frontend-svc 8080:80

# Open browser
http://localhost:8080
```

## 📱 Features

### Login Page (`/`)
- Email/Username input
- Password input
- "Remember me" option
- Link to signup page

### Signup Page (`/signup.html`)
- Username input
- Email input
- Password with confirmation
- Terms & conditions checkbox
- Auto-redirect to login after signup

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with DB status |
| POST | `/api/login` | Login or create user |
| GET | `/api/users` | List all users |

### Login/Signup Logic

```
POST /api/login {username, password}
    │
    ├── User NOT exists → Create new user
    │
    ├── User exists + correct password → Login successful
    │
    └── User exists + wrong password → "Incorrect password"
```

## 🧪 Testing

### Test via CLI
```bash
# Create user
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123"}'

# Login
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123"}'

# List users
curl http://localhost:8080/api/users
```

### Check Database
```bash
kubectl exec -it -n db postgres-0 -- \
  psql -U postgres -d postgres -c "SELECT * FROM users;"
```

### View Logs
```bash
# Backend logs
kubectl logs -n backend deployment/backend-app -f

# Frontend logs
kubectl logs -n forntend deployment/frontend-app -f
```

## 🔧 Configuration

### Environment Variables (Backend)
| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | db-svc.db.svc.cluster.local | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_USER | postgres | Database user |
| DB_PASSWORD | password123 | Database password |
| DB_NAME | postgres | Database name |
| PORT | 3000 | API server port |

## 📊 Scaling

HPA is configured for the backend:
```bash
kubectl get hpa -n backend

# Manual scaling
kubectl scale deployment/frontend-app --replicas=3 -n forntend
kubectl scale deployment/backend-app --replicas=3 -n backend
```

## 🔍 Troubleshooting

### Frontend not loading
```bash
kubectl get pods -n forntend
kubectl logs -n forntend deployment/frontend-app
```

### Backend errors
```bash
kubectl get pods -n backend
kubectl logs -n backend deployment/backend-app
kubectl describe pod -n backend <pod-name>
```

### Database connection issues
```bash
kubectl get pods -n db
kubectl exec -n db postgres-0 -- pg_isready
```

### Port-forward keeps stopping
```bash
# Run in background
kubectl port-forward -n forntend svc/frontend-svc 8080:80 &
```

## 🛠️ Development

### Rebuild Frontend
```bash
cd frontend
docker build -t salem7ouda/frontend:v10 .
docker push salem7ouda/frontend:v10
kubectl set image deployment/frontend-app frontend=salem7ouda/frontend:v10 -n forntend
```

### Rebuild Backend
```bash
cd backend
docker build -t salem7ouda/backend:v3 .
docker push salem7ouda/backend:v3
kubectl set image deployment/backend-app backend=salem7ouda/backend:v3 -n backend
```

## 📝 Namespaces

| Namespace | Components |
|-----------|------------|
| `db` | PostgreSQL, Redis |
| `backend` | Backend API pods & service |
| `forntend` | Frontend pods & service |

## ✅ Current Status

- **Frontend**: 2 replicas running (v9)
- **Backend**: 2 replicas running (v2)
- **Database**: 1 pod running (PostgreSQL 13)
- **Redis**: 1 pod running

## 📄 License

MIT License

---

**Created**: December 2025  
**Author**: salem7ouda
