package storage

import (
	"errors"
	"github.com/yourusername/weightwise-go/service"
)

type InMemoryUserStore struct {
	users map[string]service.User
}

func NewInMemoryUserStore() *InMemoryUserStore {
	return &InMemoryUserStore{
		users: map[string]service.User{
			"user1": {ID: "user1", Email: "user1@example.com", FullName: "Test User"},
		},
	}
}

func (s *InMemoryUserStore) GetUser(id string) (service.User, error) {
	user, ok := s.users[id]
	if !ok {
		return service.User{}, errors.New("user not found")
	}
	return user, nil
}
