package transport

import (
	"context"
	"encoding/json"
	"net/http"
	"github.com/yourusername/weightwise-go/endpoint"
)

// For demo: extract user ID from a query param. In production, extract from JWT/session.
func DecodeGetUserRequest(_ context.Context, r *http.Request) (interface{}, error) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		return nil, http.ErrNoCookie // Use a better error in real code
	}
	return endpoint.GetUserRequest{UserID: userID}, nil
}

func EncodeResponse(_ context.Context, w http.ResponseWriter, response interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(response)
}
