package handlers_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cyberwatch/backend-api/internal/handlers"
	"github.com/cyberwatch/backend-api/internal/models"
	"github.com/cyberwatch/backend-api/internal/repositories"
	"github.com/cyberwatch/backend-api/internal/routes"
	"github.com/cyberwatch/backend-api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupTestRouter(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	require.NoError(t, db.AutoMigrate(&models.Company{}, &models.Scan{}, &models.Vulnerability{}))

	companyRepo := repositories.NewCompanyRepository(db)
	scanRepo := repositories.NewScanRepository(db)
	vulnRepo := repositories.NewVulnerabilityRepository(db)

	return routes.Setup("http://localhost:5173", routes.Handlers{
		Companies: handlers.NewCompanyHandler(services.NewCompanyService(companyRepo)),
		Scans:     handlers.NewScanHandler(services.NewScanService(scanRepo, companyRepo)),
		Dashboard: handlers.NewDashboardHandler(services.NewDashboardService(companyRepo, scanRepo, vulnRepo)),
	})
}

func decodeData(t *testing.T, body *bytes.Buffer, dest any) {
	t.Helper()
	var envelope struct {
		Data json.RawMessage `json:"data"`
	}
	require.NoError(t, json.Unmarshal(body.Bytes(), &envelope))
	require.NoError(t, json.Unmarshal(envelope.Data, dest))
}

func TestCreateCompany(t *testing.T) {
	router := setupTestRouter(t)

	payload := `{"name":"Demo Corporation","domain":"demo.com"}`
	req := httptest.NewRequest(http.MethodPost, "/api/companies", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusCreated, w.Code)

	var company models.Company
	decodeData(t, w.Body, &company)
	require.Equal(t, "Demo Corporation", company.Name)
	require.Equal(t, "demo.com", company.Domain)
	require.NotZero(t, company.ID)
}

func TestCreateCompanyInvalidDomain(t *testing.T) {
	router := setupTestRouter(t)

	payload := `{"name":"Bad Co","domain":"not a domain"}`
	req := httptest.NewRequest(http.MethodPost, "/api/companies", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateScan(t *testing.T) {
	router := setupTestRouter(t)

	companyPayload := `{"name":"SecureTech SAS","domain":"securetech.fr"}`
	companyReq := httptest.NewRequest(http.MethodPost, "/api/companies", bytes.NewBufferString(companyPayload))
	companyReq.Header.Set("Content-Type", "application/json")
	companyRes := httptest.NewRecorder()
	router.ServeHTTP(companyRes, companyReq)
	require.Equal(t, http.StatusCreated, companyRes.Code)

	var company models.Company
	decodeData(t, companyRes.Body, &company)

	scanPayload, err := json.Marshal(map[string]uint{"companyId": company.ID})
	require.NoError(t, err)

	scanReq := httptest.NewRequest(http.MethodPost, "/api/scans", bytes.NewBuffer(scanPayload))
	scanReq.Header.Set("Content-Type", "application/json")
	scanRes := httptest.NewRecorder()
	router.ServeHTTP(scanRes, scanReq)

	require.Equal(t, http.StatusCreated, scanRes.Code)

	var scan models.Scan
	decodeData(t, scanRes.Body, &scan)
	require.Equal(t, company.ID, scan.CompanyID)
	require.Equal(t, models.ScanStatusPending, scan.Status)
}

func TestDashboardEndpoint(t *testing.T) {
	router := setupTestRouter(t)

	companyPayload := `{"name":"NovaCloud Inc","domain":"novacloud.io"}`
	companyReq := httptest.NewRequest(http.MethodPost, "/api/companies", bytes.NewBufferString(companyPayload))
	companyReq.Header.Set("Content-Type", "application/json")
	companyRes := httptest.NewRecorder()
	router.ServeHTTP(companyRes, companyReq)
	require.Equal(t, http.StatusCreated, companyRes.Code)

	req := httptest.NewRequest(http.MethodGet, "/api/dashboard", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)

	var stats services.DashboardStats
	decodeData(t, w.Body, &stats)
	require.Equal(t, int64(1), stats.Companies)
	require.GreaterOrEqual(t, stats.ActiveScans, int64(0))
}

func TestUpdateCompany(t *testing.T) {
	router := setupTestRouter(t)

	createReq := httptest.NewRequest(http.MethodPost, "/api/companies", bytes.NewBufferString(`{"name":"Old Name","domain":"old.com"}`))
	createReq.Header.Set("Content-Type", "application/json")
	createRes := httptest.NewRecorder()
	router.ServeHTTP(createRes, createReq)
	require.Equal(t, http.StatusCreated, createRes.Code)

	var company models.Company
	decodeData(t, createRes.Body, &company)

	updatePayload := `{"name":"New Name","domain":"new.com"}`
	updateReq := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/companies/%d", company.ID), bytes.NewBufferString(updatePayload))
	updateReq.Header.Set("Content-Type", "application/json")
	updateRes := httptest.NewRecorder()
	router.ServeHTTP(updateRes, updateReq)

	require.Equal(t, http.StatusOK, updateRes.Code)

	var updated models.Company
	decodeData(t, updateRes.Body, &updated)
	require.Equal(t, "New Name", updated.Name)
	require.Equal(t, "new.com", updated.Domain)
}

func TestDeleteCompany(t *testing.T) {
	router := setupTestRouter(t)

	createReq := httptest.NewRequest(http.MethodPost, "/api/companies", bytes.NewBufferString(`{"name":"Temp Co","domain":"temp.co"}`))
	createReq.Header.Set("Content-Type", "application/json")
	createRes := httptest.NewRecorder()
	router.ServeHTTP(createRes, createReq)
	require.Equal(t, http.StatusCreated, createRes.Code)

	var company models.Company
	decodeData(t, createRes.Body, &company)

	deleteReq := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/companies/%d", company.ID), nil)
	deleteRes := httptest.NewRecorder()
	router.ServeHTTP(deleteRes, deleteReq)
	require.Equal(t, http.StatusOK, deleteRes.Code)

	getReq := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/companies/%d", company.ID), nil)
	getRes := httptest.NewRecorder()
	router.ServeHTTP(getRes, getReq)
	require.Equal(t, http.StatusNotFound, getRes.Code)
}
