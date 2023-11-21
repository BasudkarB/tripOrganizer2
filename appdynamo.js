//Note to self: Delete the access keys once done.
const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Set up AWS DynamoDB configuration
AWS.config.update({
  region: 'us-east-2', // e.g., 'us-east-1'
  accessKeyId: '',
  secretAccessKey: '',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Define a table name
const User = 'users';
const Trip = 'trips'
const Relation = 'relations'

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

app.post('/createUser', (req, res) => {
  const { id, name, email } = req.body;

  // Create a new user object
  const user = {
    id,
    name,
    email 
  };

  params = {
    TableName: User,
    Item: user,
  };

  // Put the user data into DynamoDB
  dynamodb.put(params, (err, data) => {
    if (err) {
      console.error('Error putting user into DynamoDB:', err);
      res.status(500).json({ error: 'Could not create user' });
    } else {
      console.log('User created successfully');
      res.status(200).json({ message: 'User created successfully' });
    }
  });
});

app.post('/createTrip', (req, res) => {
  const { id, name, dest, start, end } = req.body;

  // Create a new trip object
  const trip = {
    id,
    name,
    dest,
    start,
    end 
  };

  const params = {
    TableName: Trip,
    Item: trip,
  };

  // Put the user trip into DynamoDB
  dynamodb.put(params, (err, data) => {
    if (err) {
      console.error('Error putting trip into DynamoDB:', err);
      res.status(500).json({ error: 'Could not create Trp' });
    } else {
      console.log('Trip created successfully');
      res.status(200).json({ message: 'Trip created successfully' });
    }
  });
});

app.post('/createRelation', (req, res) => {
  const { id, trip_id, user_id } = req.body;

  // Create a new user object
  const relation = {
    id,
    trip_id,
    user_id
  };

  params = {
    TableName: Relation,
    Item: relation,
  };

  // Put the relation data into DynamoDB
  dynamodb.put(params, (err, data) => {
    if (err) {
      console.error('Error putting relation into DynamoDB:', err);
      res.status(500).json({ error: 'Could not create relation' });
    } else {
      console.log('relation created successfully');
      res.status(200).json({ message: 'relation created successfully' });
    }
  });
});

app.get('/users', (req, res) => {
  params = {
    TableName: User,
  };

  // Scan the User table to get all users
  dynamodb.scan(params, (err, data) => {
    if (err) {
      console.error('Error scanning users from DynamoDB:', err);
      res.status(500).json({ error: 'Could not retrieve users' });
    } else {
      console.log('Users retrieved successfully');
      res.status(200).json(data.Items); // Return the array of users
    }
  });
});

app.get('/user/:id', (req, res) => {
  const { id } = req.params;

  const params = {
    TableName: User,
    Key: {
      id: id,
    },
  };

  // Get a specific user by their id
  dynamodb.get(params, (err, data) => {
    if (err) {
      console.error(`Error getting user with id ${id} from DynamoDB:`, err);
      res.status(500).json({ error: 'Could not retrieve user' });
    } else {
      if (data.Item) {
        console.log(`User with id ${id} retrieved successfully`);
        res.status(200).json(data.Item); // Return the user as JSON
      } else {
        console.log(`User with id ${id} not found`);
        res.status(404).json({ message: 'User not found' });
      }
    }
  });
});

app.get('/trips', (req, res) => {
  params = {
    TableName: Trip,
  };

  // Scan the User table to get all trips
  dynamodb.scan(params, (err, data) => {
    if (err) {
      console.error('Error scanning trips from DynamoDB:', err);
      res.status(500).json({ error: 'Could not retrieve trips' });
    } else {
      console.log('Trips retrieved successfully');
      res.status(200).json(data.Items); // Return the array of users
    }
  });
});

app.get('/trip/:id', (req, res) => {
  const { id } = req.params;

  const params = {
    TableName: Trip,
    Key: {
      id: id,
    },
  };

  // Get a specific trip by  id
  dynamodb.get(params, (err, data) => {
    if (err) {
      console.error(`Error getting trip with id ${id} from DynamoDB:`, err);
      res.status(500).json({ error: 'Could not retrieve trip' });
    } else {
      if (data.Item) {
        console.log(`Trip with id ${id} retrieved successfully`);
        res.status(200).json(data.Item); // Return the trip as JSON
      } else {
        console.log(`Trip with id ${id} not found`);
        res.status(404).json({ message: 'Trip not found' });
      }
    }
  });
});


app.get('/user/:userId/travel-buddies', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Step 1: Scan the relations table to find items where user_id is the specified userId
    const paramsStep1 = {
      TableName: Relation,
      FilterExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ProjectionExpression: 'trip_id', // Include only the 'trip_id' attribute in the result
    };

    dynamodb.scan(paramsStep1, async (err, dataStep1) => {
      if (err) {
        console.error('Error scanning relations from DynamoDB:', err);
        res.status(500).json({ error: 'Could not retrieve relations' });
      } else {
        console.log('Relations retrieved successfully');

        // Step 2: Extract unique trip IDs from the result
        const tripIds = [...new Set(dataStep1.Items.map(item => item.trip_id))];

        // Step 3: Scan the relations table again to find items with the same trip_id
        const paramsStep3 = {
          TableName: Relation,
          FilterExpression: 'contains(:tripId, trip_id) AND user_id <> :userId', // Exclude the specified user
          ExpressionAttributeValues: {
            ':tripId': tripIds,
            ':userId': userId,
          },
          ProjectionExpression: 'user_id', // Include only the 'user_id' attribute in the result
        };

        dynamodb.scan(paramsStep3, async (err, dataStep3) => {
          if (err) {
            console.error('Error scanning relations from DynamoDB:', err);
            res.status(500).json({ error: 'Could not retrieve relations' });
          } else {
            console.log('Relations retrieved successfully');

            // Step 4: Extract unique user IDs from the result
            const travelBuddyUserIds = [...new Set(dataStep3.Items.map(item => item.user_id))];

            // Include the specified user in the list of travel buddies
            travelBuddyUserIds.push(userId);

            // Step 5: Get information about users from the Users table
            const usersInfo = await Promise.all(
              travelBuddyUserIds.map(async (id) => {
                const userParams = {
                  TableName: User,
                  Key: {
                    id: id,
                  },
                };

                return new Promise((resolve, reject) => {
                  dynamodb.get(userParams, (err, userData) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(userData.Item);
                    }
                  });
                });
              })
            );

            // Step 6: Return the information about travel buddies
            res.status(200).json({ travelBuddies: usersInfo });
          }
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching travel-buddies' });
  }
});

