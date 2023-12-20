// main.go
package main

import (
	"context"
	"fmt"
	"log"

	"tripOrganizer/users"

	"google.golang.org/grpc"
)

func main() {
	conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure())
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close()

	client := users.NewUserServiceClient(conn)

	// Get user list
	userList, err := client.GetUserList(context.Background(), &users.UserRequest{})
	if err != nil {
		log.Fatalf("Error calling GetUserList: %v", err)
	}
	fmt.Println("User List:")
	for _, user := range userList.Users {
		fmt.Printf("ID: %s, Name: %s, Email: %s\n", user.Id, user.Name, user.Email)
	}

	// Get user by ID
	userById, err := client.GetUserById(context.Background(), &users.UserIdRequest{UserId: "1"})
	if err != nil {
		log.Fatalf("Error calling GetUserById: %v", err)
	}
	fmt.Printf("\nUser by ID (1):\nID: %s, Name: %s, Email: %s\n", userById.User.Id, userById.User.Name, userById.User.Email)

	// Call the streaming RPC method
	stream, err := client.StreamLocations(context.Background())
	if err != nil {
		log.Fatalf("Error calling StreamLocations: %v", err)
	}

	// Receive and process GPS coordinates from the server
	for {
		location, err := stream.Recv()
		if err != nil {
			log.Fatalf("Error receiving location: %v", err)
		}

		// Process the received location
		fmt.Printf("Received location: User ID: %s, Latitude: %f, Longitude: %f\n", location.UserId, location.Latitude, location.Longitude)
	}
}
