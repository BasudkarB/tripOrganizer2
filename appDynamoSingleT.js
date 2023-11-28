require('dotenv').config();

const express = require('express');
const AWS = require('aws-sdk');

const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Set up AWS DynamoDB configuration
AWS.config.update({
    region: 'us-east-2', // e.g., 'us-east-1'
    accessKeyId: process.env.dynamoAccessKeyId,
    secretAccessKey: process.env.dynamoSecretAccessKey,
  });

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Define the DynamoDB table name
const tableName = 'userTrips';

// Middleware to parse JSON
app.use(express.json());


// GET /users
app.get('/users', async (req, res) => {
  try {
    const params = {
      TableName: tableName,
      FilterExpression: 'item_type = :type',
      ExpressionAttributeValues: {
        ':type': 'user',
      },
    };

    const result = await dynamoDB.scan(params).promise();
    res.json(result.Items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /trips
app.get('/trips', async (req, res) => {
  try {
    const params = {
      TableName: tableName,
      FilterExpression: 'item_type = :type',
      ExpressionAttributeValues: {
        ':type': 'trip',
      },
    };

    const result = await dynamoDB.scan(params).promise();
    res.json(result.Items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /user/{id}
app.get('/user/:id', async (req, res) => {
    const userId = req.params.id;
  
    try {
      const params = {
        TableName: tableName,
        Key: {
          id: userId,
        },
      };
  
      const result = await dynamoDB.get(params).promise();
  
      // Check if the result has an Item property
      if (result.Item && result.Item.item_type === 'user') {
        res.json(result.Item);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });
  

// GET /trip/{id}
app.get('/trip/:id', async (req, res) => {
    const tripId = req.params.id;
  
    try {
      const params = {
        TableName: tableName,
        Key: {
          id: tripId,
        },
      };
  
      const result = await dynamoDB.get(params).promise();
  
      // Check if the result has an Item property
      if (result.Item && result.Item.item_type === 'trip') {
        res.json(result.Item);
      } else {
        res.status(404).json({ error: 'Trip not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });
  
// GET /user/{id}/travel-buddies
app.get('/user/:id/travel-buddies', async (req, res) => {
    const userId = req.params.id;
  
    try {
      // Step 1: Get the trip IDs associated with the user
      const userParams = {
        TableName: tableName,
        FilterExpression: 'id = :id AND item_type = :type',
        ExpressionAttributeValues: {
          ':id': userId,
          ':type': 'user',
        },
      };
  
      const userResult = await dynamoDB.scan(userParams).promise();
  
      if (userResult.Items.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const userTrips = userResult.Items[0].travel_buddies || [];
  
      // Step 2: Get details of travel buddies for each trip
      const travelBuddies = [];
  
      for (const tripId of userTrips) {
        const tripParams = {
          TableName: tableName,
          Key: {
            id: tripId,
          },
        };
  
        const tripResult = await dynamoDB.get(tripParams).promise();
  
        // Check if the result has an Item property and is a trip
        if (tripResult.Item && tripResult.Item.item_type === 'trip') {
          // Extract details of the trip
          const { id, name, destination, start_date, end_date, travel_buddies: tripTravelBuddies } = tripResult.Item;
  
          // Step 3: Get details of users travelling on the trip
        const usersOnTrip = await Promise.all(tripTravelBuddies.map(async (userId) => {
            const userParams = {
            TableName: tableName,
            Key: {
                id: userId,
            },
            };
        
            try {
            const userResult = await dynamoDB.get(userParams).promise();
        
            // Check if the result has an Item property and is a user
            if (userResult.Item && userResult.Item.item_type === 'user') {
                // Extract details of the user
                const { id, name, email } = userResult.Item;
                return { id, name, email };
            }
            } catch (error) {
            console.error('Error fetching user:', error);
            }
        
            return null;
        }));
  
  
  
          travelBuddies.push({
            trip: {
              id,
              name,
              destination,
              start_date,
              end_date,
            },
            travel_buddies: usersOnTrip.filter(user => user !== null), // Filter out any null values
          });
        }
      }
  
      res.json(travelBuddies);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
