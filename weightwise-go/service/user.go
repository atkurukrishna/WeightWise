package service

type User struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
}

type UserService interface {
	GetUser(userID string) (User, error)
}

func NewUserService(store UserStore) UserService {
	return &userService{store: store}
}

type userService struct {
	store UserStore
}

func (s *userService) GetUser(userID string) (User, error) {
	return s.store.GetUser(userID)
}

// UserStore abstracts the storage layer for users
// For now, we use an in-memory stub. Replace with Postgres for production.
type UserStore interface {
	GetUser(id string) (User, error)
}
