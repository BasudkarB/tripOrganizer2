const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const supabaseUrl = '';
const supabaseKey = "";
const supabase = createClient(supabaseUrl, supabaseKey);


// Middleware to parse JSON request bodies
app.use(express.json());

// Swagger Options
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Trip Organizer API Documentation',
      version: '1.0.0',
      description: 'API documentation for Trip Organizer endpoints',
    },
  },
  apis: ['./app.js'], // Path to Express.js file
};

const specs = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


// Route definitions below
//get all users and their data
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users and their data.
 *     responses:
 *       200:
 *         description: Successful response with user data.
 *       500:
 *         description: Internal server error.
 */
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('Users').select('*');

    if (error) {
      throw error;
    }
    res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});

//get all trips data
/**
 * @swagger
 * /trips:
 *   get:
 *     summary: Get all trips data.
 *     responses:
 *       200:
 *         description: Successful response with trip data.
 *       500:
 *         description: Internal server error.
 */
app.get('/trips', async (req, res) => {
  try {
    const { data, error } = await supabase.from('Trips').select('*');

    if (error) {
      throw error;
    }
    res.json(data);

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'An error occurred while fetching data' });
  }
});

//get specific user data
/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get specific user data.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to get.
 *     responses:
 *       200:
 *         description: Successful response with user data.
 *       500:
 *         description: Internal server error.
 */
app.get('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('ID', userId)
      .single();

    if (error) {
      throw error;
    }
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});

//get specific trip data
/**
 * @swagger
 * /trip/{id}:
 *   get:
 *     summary: Get specific trip data.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the trip to get.
 *     responses:
 *       200:
 *         description: Successful response with trip data.
 *       500:
 *         description: Internal server error.
 */
app.get('/trip/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const { data, error } = await supabase
      .from('Trips')
      .select('*')
      .eq('ID', userId)
      .single();

    if (error) {
      throw error;
    }
    if (data) {
      res.status(200).json(data);
    } else {
      // res.status(404).json({ error: 'Trip not found' });
    }
  } catch (error) {
    console.error('Error fetching trip data:', error);
    res.status(500).json({ error: 'An error occurred while fetching trip data' });
  }
});

//get trip data by destination name
/**
 * @swagger
 * /tripDes/{destination}:
 *   get:
 *     summary: Get trip data by destination name.
 *     parameters:
 *       - in: path
 *         name: destination
 *         required: true
 *         schema:
 *           type: integer
 *         description: destination of the trip to get.
 *     responses:
 *       200:
 *         description: Successful response with data.
 *       500:
 *         description: Internal server error.
 */
app.get('/tripDes/:destination', async (req, res) => {
  try {
    const destination = req.params.destination;

    const { data, error } = await supabase
      .from('Trips')
      .select('*')
      .ilike('destination', `%${destination}%`); 

    if (error) {
      throw error;
    }

    if (data) {
      res.status(200).json(data);
    } else {
      // res.status(404).json({ error: 'No trips found for the specified destination' });
    }
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'An error occurred while fetching trips' });
  }
});

////get trip buddies: users travelling on same trip
/**
 * @swagger
 * /user/{id}/travel-buddies:
 *   get:
 *     summary: Get get trip buddies- users travelling on same trip.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to get travel buddies.
 *     responses:
 *       200:
 *         description: Successful response with data.
 *       500:
 *         description: Internal server error.
 */
app.get('/user/:id/travel-buddies', async (req, res) => {
  try {
    const id = req.params.id;

    const { data: userData, error: userError } = await supabase
      .from('UserTrips')
      .select('trip_id')
      .eq('user_id', id);

    if (userError) {
      throw userError;
    }

    if (userData && userData.length > 0) {
      const tripIds = userData.map(trip => trip.trip_id);

      const { data: buddiesData, error: buddiesError } = await supabase
        .from('UserTrips')
        .select('user_id, trip_id')
        .in('trip_id', tripIds);

      if (buddiesError) {
        throw buddiesError;
      }

      if (buddiesData) {
        // Use Set to remove duplicates
        const uniqueUserIds = [...new Set(buddiesData.map(item => item.user_id))];

        // Fetch user names and trip names from the Users and Trips tables based on the unique user and trip IDs
        const { data: usersData, error: usersError } = await supabase
          .from('Users')
          .select('ID, name') 
          .in('ID', uniqueUserIds);

        const { data: tripsData, error: tripsError } = await supabase
          .from('Trips')
          .select('ID, trip_name')
          .in('ID', tripIds);

        if (usersError || tripsError) {
          throw usersError || tripsError;
        }

        if (usersData && tripsData) {
          // Combine user data with trip names
          const combinedData = usersData.map(user => {
            const tripInfo = tripsData.find(trip => trip.trip_id === user.user_id);
            return {
              user_id: user.user_id,
              name: user.name,
              trip_name: tripInfo ? tripInfo.trip_name : null
            };
          });

          res.status(200).json(combinedData);
        } else {
          res.status(404).json({ error: 'No user names or trip names found for the specified travel buddies' });
        }
      } else {
        res.status(404).json({ error: 'No travel buddies found for the specified id' });
      }
    } else {
      res.status(404).json({ error: 'No trips found for the specified user id' });
    }
  } catch (error) {
    console.error('Error fetching buddies:', error);
    res.status(500).json({ error: 'An error occurred while fetching buddies' });
  }
});

//////

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
