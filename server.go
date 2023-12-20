// server.go

package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"time"

	"tripOrganizer/users"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type userServiceServer struct {
	users.UnimplementedUserServiceServer
}

func (s *userServiceServer) GetUserList(ctx context.Context, req *users.UserRequest) (*users.UserListResponse, error) {
	// Mocked user data
	userList := []*users.User{
		{Id: "1", Name: "John Doe", Email: "john@example.com"},
		{Id: "2", Name: "Jane Doe", Email: "jane@example.com"},
	}

	return &users.UserListResponse{Users: userList}, nil
}

func (s *userServiceServer) GetUserById(ctx context.Context, req *users.UserIdRequest) (*users.UserResponse, error) {
	// Mocked user data
	userList := []*users.User{
		{Id: "1", Name: "John Doe", Email: "john@example.com"},
		{Id: "2", Name: "Jane Doe", Email: "jane@example.com"},
	}

	// Find the user with the requested ID
	var foundUser *users.User
	for _, user := range userList {
		if user.Id == req.UserId {
			foundUser = user
			break
		}
	}

	// If the user is not found, return a gRPC error with status code NotFound
	if foundUser == nil {
		return nil, status.Errorf(codes.NotFound, "User not found")
	}

	return &users.UserResponse{User: foundUser}, nil
}

func (s *userServiceServer) StreamLocations(stream users.UserService_StreamLocationsServer) error {
	for {
		// Simulate users walking at a pace
		locations := []*users.Location{
			{UserId: "user1", Latitude: 37.7749, Longitude: -122.4194}, // San Francisco, CA
			{UserId: "user2", Latitude: 40.7128, Longitude: -74.0060},  // New York, NY

		}

		// Update coordinates once every second
		for _, location := range locations {
			// Send the location to the client
			if err := stream.Send(location); err != nil {
				return err
			}
			time.Sleep(time.Second)
		}
	}
}

// func (s *userServiceServer) Chat(stream users.UserService_ChatServer) error {
// 	for {
// 		// Receive messages from the client
// 		message, err := stream.Recv()
// 		if err == io.EOF {
// 			// Client has closed the stream
// 			return nil
// 		}
// 		if err != nil {
// 			log.Printf("Error receiving message: %v", err)
// 			return err
// 		}

// 		// Process the received message (for example, log it)
// 		log.Printf("Received message from %s: %s", message.UserId, message.Message)

// 		// You can send a response back to the client if needed
// 		response := &users.ChatMessage{UserId: "server", Message: "Message received"}
// 		if err := stream.Send(response); err != nil {
// 			log.Printf("Error sending response: %v", err)
// 			return err
// 		}
// 	}
// }

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	s := grpc.NewServer()
	users.RegisterUserServiceServer(s, &userServiceServer{})
	fmt.Println("gRPC server is running on port 50051...")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
