# Troubleshooting Guide - Issues & Solutions

This document chronicles all issues encountered during development and deployment of this Kubernetes full-stack application.

---

## Issue #1: Go Module Checksum Mismatch

### Error
```
verifying github.com/gabriel-vasile/mimetype@v1.4.2/go.mod: checksum mismatch
SECURITY ERROR - This download does NOT match an earlier download recorded in go.sum
```

### Cause
- Corrupted/truncated checksums in `go.sum` file
- Non-existent dependency version `github.com/gin-contrib/sse@v1.3.4`

### Solution
1. Fixed dependency versions in `go.mod`:
   - `github.com/gin-contrib/sse`: `v1.3.4` → `v0.1.0`
   - `github.com/bytedance/sonic`: `v1.8.8` → `v1.9.1`

2. Regenerated `go.sum`:
   ```bash
   docker run --rm -v $(pwd):/app -w /app golang:1.21-alpine sh -c \
     "apk add --no-cache git && go mod tidy"
   ```

---

## Issue #2: NGINX DNS Resolution Failure

### Error
```
nginx: [emerg] host not found in upstream "backend-svc.backend.svc.cluster.local"
Status: CrashLoopBackOff
```

### Cause
NGINX resolves DNS at **startup time**. If backend doesn't exist yet, NGINX fails to start.

### Solution
Used variable to **defer DNS resolution** to request time:

```nginx
location /api/ {
    resolver kube-dns.kube-system.svc.cluster.local valid=10s;
    set $backend "http://backend-svc.backend.svc.cluster.local:3000";
    proxy_pass $backend;  # Variable defers DNS lookup
}
```

---

## Issue #3: Backend Image Pull Error

### Error
```
Status: ErrImagePull / ImagePullBackOff
Image: salem7ouda/backend:v1
```

### Cause
Docker Hub only had `salem7ouda/backend:latest`, tag `v1` didn't exist.

### Solution
Updated deployment to use existing tag:
```yaml
image: salem7ouda/backend:latest
```

---

## Issue #4: Backend Secret Not Found

### Error
```
Error: secret "data-secrets" not found
Status: CreateContainerConfigError
```

### Cause
Secret existed in `db` namespace but backend runs in `backend` namespace.

### Solution
Changed to use direct environment variable:
```yaml
- name: DB_PASSWORD
  value: "password123"
```

---

## Issue #5: Database Connection Failed

### Error
```
Failed to ping database: dial tcp: lookup postgres.db.svc.cluster.local: no such host
```

### Cause
Wrong service name. Used `postgres.db` but actual service is `db-svc.db`.

### Investigation
```bash
kubectl get svc -n db
# NAME        TYPE        CLUSTER-IP      PORT(S)
# db-svc      ClusterIP   10.96.7.230     5432/TCP
```

### Solution
Updated `DB_HOST` environment variable:
```yaml
- name: DB_HOST
  value: "db-svc.db.svc.cluster.local"
```

---

## Issue #6: Signup Link Showing Alert Instead of Redirecting

### Error
Clicking "Create one" showed: `Sign up functionality - Coming soon!`

### Cause
JavaScript event handler was intercepting the click with `e.preventDefault()` and showing an alert instead of using the HTML `href`.

### Solution
Removed the JavaScript event handler, let HTML handle navigation:
```html
<a href="signup.html">Create one</a>
```

---

## Issue #7: Duplicate Username Error on Signup

### Error
```
Signup failed: Failed to create user: pq: duplicate key value violates unique constraint "users_username_key"
```

### Cause
Backend logic checked username+password together. If no match, tried INSERT which failed for existing usernames with different passwords.

### Solution
Updated backend to check username first, then verify password:
```go
// First check if user exists by username only
err := db.QueryRow("SELECT id, password FROM users WHERE username = $1", req.Username).Scan(&userID, &storedPassword)

if err == sql.ErrNoRows {
    // User doesn't exist - create new
} else {
    // User exists - check password
    if storedPassword != req.Password {
        // Wrong password
    } else {
        // Login successful
    }
}
```

---

## Issue #8: Port-Forward Keeps Stopping

### Symptom
```
curl: (7) Failed to connect to localhost port 8080: Connection refused
This site can't be reached
```

### Cause
- Port-forward stops when pods restart
- Port-forward stops when deployment is updated
- Port-forward runs in foreground and can be killed

### Solution
Restart port-forward after deployments:
```bash
# Run in background
kubectl port-forward -n forntend svc/frontend-svc 8080:80 &

# Or keep terminal open
kubectl port-forward -n forntend svc/frontend-svc 8080:80
```

---

## Issue #9: Browser Cache Showing Old Version

### Symptom
Server returns new code but browser shows old behavior.

### Cause
Browser caches JavaScript files aggressively.

### Solution
```bash
# Hard refresh in browser
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)

# Or use incognito mode
```

---

## Issue #10: Kubernetes Image Not Updating

### Symptom
New Docker image pushed but pods still run old code.

### Cause
`imagePullPolicy: IfNotPresent` - Kubernetes uses cached image.

### Solution
```bash
# Option 1: Use new tag
docker build -t salem7ouda/frontend:v10 .
docker push salem7ouda/frontend:v10
kubectl set image deployment/frontend-app frontend=salem7ouda/frontend:v10 -n forntend

# Option 2: Force restart
kubectl rollout restart deployment/frontend-app -n forntend

# Option 3: Change pull policy
kubectl patch deployment frontend-app -n forntend \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"frontend","imagePullPolicy":"Always"}]}}}}'
```

---

## Quick Diagnostic Commands

### Check All Pods
```bash
kubectl get pods -n forntend
kubectl get pods -n backend
kubectl get pods -n db
```

### Check Pod Logs
```bash
kubectl logs -n backend deployment/backend-app --tail=50
kubectl logs -n forntend deployment/frontend-app --tail=50
```

### Describe Pod for Events
```bash
kubectl describe pod -n backend <pod-name>
```

### Check Services
```bash
kubectl get svc -n db
kubectl get svc -n backend
kubectl get svc -n forntend
```

### Test Database Connection
```bash
kubectl exec -it -n db postgres-0 -- pg_isready
kubectl exec -it -n db postgres-0 -- \
  psql -U postgres -d postgres -c "SELECT COUNT(*) FROM users;"
```

### Test Backend API (from inside cluster)
```bash
kubectl run test-curl --image=curlimages/curl -i --rm --restart=Never -- \
  curl -s http://backend-svc.backend:3000/health
```

### Restart Everything
```bash
kubectl rollout restart deployment/frontend-app -n forntend
kubectl rollout restart deployment/backend-app -n backend
```

---

## Lessons Learned

1. **Go Modules**: Always verify `go.sum` integrity before Docker builds
2. **NGINX Proxying**: Use variables to defer DNS resolution
3. **Kubernetes Secrets**: Ensure secrets exist in the correct namespace
4. **Service Names**: Always verify actual service names with `kubectl get svc`
5. **Image Tags**: Use explicit version tags, not just `latest`
6. **Port-Forward**: Expect it to stop after deployments, restart as needed
7. **Browser Cache**: Always hard refresh when testing frontend changes
8. **Error Messages**: Backend should give clear, specific error messages

---

**Last Updated**: December 2024
