const express = require('express');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define Mongoose schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String
});

const tripSchema = new mongoose.Schema({
  tripName: String,
  destination: String,
  startDate: Date,
  endDate: Date
});

const userTripSchema = new mongoose.Schema({
  userId: String,
  tripId: String
});



const User = mongoose.model('users', userSchema);
const Trip = mongoose.model('trips', tripSchema);
const UserTrip = mongoose.model('usertrips', userTripSchema);

module.exports = User;
module.exports = Trip;
module.exports = UserTrip;

// Create Express app
const app = express();
app.use(express.json());

// API endpoints

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get user by ID
app.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all trips
app.get('/trips', async (req, res) => {
  try {
    const trips = await Trip.find();
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get trip by ID
app.get('/trip/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// app.get('/usersR', async (req, res) => {
//   try {
//     const users = await UserTrip.find();
//     console.log(users)
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// Get user and travel buddies for a specific user
app.get('/user/:id/travel-buddies', async (req, res) => {
  try {
    const userId = req.params.id;

    // Step 1: Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(userId)
    // Step 2: Get all trips of the user from UserTrip
    const userTrips = await UserTrip.find({ userId: userId });
    console.log(userTrips)
    const tripIds = userTrips.map(userTrip => userTrip.tripId);

    // Step 3: Find other users in UserTrip with the same trips
    const travelBuddies = await UserTrip.find({ tripId: { $in: tripIds }, userId: { $ne: userId } });
    const travelBuddiesIds = travelBuddies.map(buddy => buddy.userId);

    // Step 4: Fetch details of the travel buddies from the User collection
    const travelBuddiesInfo = await User.find({ _id: { $in: travelBuddiesIds } });

    res.json({
      user,
      travelBuddies: travelBuddiesInfo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
