package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

var db *sql.DB

// LoginRequest represents the login request body
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	UserID  int    `json:"user_id,omitempty"`
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
}

func init() {
	// Initialize database connection
	var err error
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getEnv("DB_HOST", "postgres.db.svc.cluster.local"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "postgres"),
		getEnv("DB_NAME", "postgres"),
	)

	db, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("Database connected successfully")

	// Create users table if it doesn't exist
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(50) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatal("Failed to create table:", err)
	}

	log.Println("Users table ready")
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// Health check endpoint
func healthCheck(c *gin.Context) {
	dbStatus := "connected"
	if err := db.Ping(); err != nil {
		dbStatus = "disconnected"
	}

	c.JSON(http.StatusOK, HealthResponse{
		Status:   "ok",
		Database: dbStatus,
	})
}

// Login endpoint
func login(c *gin.Context) {
	var req LoginRequest

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, LoginResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	// First, check if user exists (by username only)
	var userID int
	var storedPassword string
	err := db.QueryRow("SELECT id, password FROM users WHERE username = $1", req.Username).Scan(&userID, &storedPassword)

	if err == sql.ErrNoRows {
		// User doesn't exist, create new user
		err = db.QueryRow("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id", req.Username, req.Password).Scan(&userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, LoginResponse{
				Success: false,
				Message: "Failed to create user: " + err.Error(),
			})
			return
		}

		c.JSON(http.StatusCreated, LoginResponse{
			Success: true,
			Message: "User created successfully",
			UserID:  userID,
		})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Success: false,
			Message: "Database error: " + err.Error(),
		})
		return
	}

	// User exists - check if password matches
	if storedPassword != req.Password {
		c.JSON(http.StatusUnauthorized, LoginResponse{
			Success: false,
			Message: "Incorrect password",
		})
		return
	}

	// User exists and password matches - login successful
	c.JSON(http.StatusOK, LoginResponse{
		Success: true,
		Message: "Login successful",
		UserID:  userID,
	})
}

// List users endpoint (for debugging)
func listUsers(c *gin.Context) {
	rows, err := db.Query("SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT 10")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id int
		var username, createdAt string
		if err := rows.Scan(&id, &username, &createdAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		users = append(users, map[string]interface{}{
			"id":         id,
			"username":   username,
			"created_at": createdAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

func main() {
	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Routes
	router.GET("/health", healthCheck)
	router.POST("/api/login", login)
	router.GET("/api/users", listUsers)

	port := getEnv("PORT", "3000")
	log.Printf("Server running on port %s", port)
	router.Run(":" + port)
}
