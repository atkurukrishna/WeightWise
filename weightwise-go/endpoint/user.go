package endpoint

import (
	"context"
	"log"

	"github.com/go-kit/kit/endpoint"
	"github.com/yourusername/weightwise-go/service"
)

type GetUserRequest struct {
	UserID string
}

type GetUserResponse struct {
	User service.User `json:"user"`
	Err  string       `json:"err,omitempty"`
}

func MakeUserEndpoints(svc service.UserService) UserEndpoints {
	return UserEndpoints{
		GetUserEndpoint: MakeGetUserEndpoint(svc),
	}
}

type UserEndpoints struct {
	GetUserEndpoint endpoint.Endpoint
}

func MakeGetUserEndpoint(svc service.UserService) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		log.Println("GetUserEndpoint called")
		req := request.(GetUserRequest)
		user, err := svc.GetUser(req.UserID)
		if err != nil {
			return GetUserResponse{Err: err.Error()}, nil
		}
		return GetUserResponse{User: user}, nil
	}
}
