package main

import (
	"fmt"
	"log"

	"net/http"

	kithttp "github.com/go-kit/kit/transport/http"
	"github.com/gorilla/mux"

	"github.com/yourusername/weightwise-go/endpoint"
	"github.com/yourusername/weightwise-go/service"
	"github.com/yourusername/weightwise-go/storage"
	"github.com/yourusername/weightwise-go/transport"
)

func main() {
	// Storage (stub, replace with real Postgres connection)
	store := storage.NewInMemoryUserStore()

	// Service
	userService := service.NewUserService(store)

	// Endpoints
	userEndpoints := endpoint.MakeUserEndpoints(userService)

	// HTTP Handlers
	r := mux.NewRouter()
	r.Handle("/api/auth/user", kithttp.NewServer(
		userEndpoints.GetUserEndpoint,
		transport.DecodeGetUserRequest,
		transport.EncodeResponse,
	)).Methods("GET")

	fmt.Println("Server listening on :5000")
	log.Fatal(http.ListenAndServe("localhost:5000", r))
}
