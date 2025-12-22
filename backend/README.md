# Backend API Documentation

## Overview
Simple Go backend API for handling user login with PostgreSQL database storage.

## API Endpoints

### 1. Health Check
**GET** `/health`

Check if the backend service is running and database is connected.

**Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

### 2. Login / Register
**POST** `/api/login`

Handles login and registration. If username doesn't exist, creates a new user.

**Request:**
```json
{
  "username": "john_doe",
  "password": "secure_password"
}
```

**Response (New User - 201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user_id": 1
}
```

**Response (Existing User - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user_id": 1
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid request: ..."
}
```

### 3. List Users (Debug)
**GET** `/api/users`

Returns the last 10 registered users (for debugging only).

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "created_at": "2024-12-22T10:30:00Z"
    }
  ]
}
```

## Environment Variables

- `DB_HOST` - PostgreSQL host (default: `postgres.db.svc.cluster.local`)
- `DB_PORT` - PostgreSQL port (default: `5432`)
- `DB_USER` - PostgreSQL username (default: `postgres`)
- `DB_PASSWORD` - PostgreSQL password (required)
- `DB_NAME` - Database name (default: `postgres`)
- `PORT` - Server port (default: `3000`)

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Building the Docker Image

```bash
cd backend
docker build -t salem7ouda/backend:v1 .
docker push salem7ouda/backend:v1
```

## Deploying to Kubernetes

```bash
# Deploy backend service and deployment
kubectl apply -f 06-backend-deployment.yaml

# Deploy HPA for autoscaling
kubectl apply -f 07-backend-hpa.yaml

# Check deployment status
kubectl get pods -n forntend
kubectl get svc -n forntend

# Check HPA status
kubectl get hpa -n forntend
kubectl describe hpa backend-hpa -n forntend
```

## Testing

### Test with curl
```bash
# Health check
curl http://backend-svc:3000/health

# Login/Register
curl -X POST http://backend-svc:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","password":"test_pass"}'

# List users
curl http://backend-svc:3000/api/users
```

### Port Forward for Local Testing
```bash
kubectl port-forward -n forntend svc/backend-svc 3000:3000
```

Then access at `http://localhost:3000`

## HPA Configuration

The backend is configured with Horizontal Pod Autoscaler:
- **Min Replicas:** 2
- **Max Replicas:** 10
- **Scale Up Trigger:** CPU > 70% or Memory > 80%
- **Scale Down:** After 5 minutes of low usage

## Security Notes

⚠️ **Warning:** This is a demo application. For production:
- Hash passwords using bcrypt or Argon2
- Use proper authentication tokens (JWT)
- Implement rate limiting
- Add input validation and sanitization
- Use HTTPS/TLS
- Implement proper error handling
- Add database connection pooling
