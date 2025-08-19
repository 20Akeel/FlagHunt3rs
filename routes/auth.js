const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

// ===== CHECK AUTH STATUS ===== 
router.get('/status', async (req, res) => {
  if (req.session.user) {
    try {
      // Fetch the latest user data from database to include solved challenges
      const user = await User.findById(req.session.user._id);
      
      if (user) {
        console.log('Auth status check - user found:', user.username, 'solved challenges:', user.solvedChallenges?.length);
        res.json({ 
          loggedIn: true, 
          username: user.username,
          userId: user._id,
          email: user.email,
          solvedChallenges: user.solvedChallenges || []
        });
      } else {
        console.log('Auth status check - user not found in database');
        res.json({ loggedIn: false });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.json({ 
        loggedIn: true, 
        username: req.session.user.username,
        userId: req.session.user._id,
        email: req.session.user.email,
        solvedChallenges: req.session.user.solvedChallenges || []
      });
    }
  } else {
    res.json({ loggedIn: false });
  }
});

// ===== SIGN UP =====
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if email already used
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if username already used
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const newUser = new User({
      username,
      name: username, // Set name same as username
      email,
      password: hashedPassword,
      joinDate: new Date(),
      solvedChallenges: []
    });

    await newUser.save();
    req.session.user = newUser;
    
    console.log('New user created:', newUser.username);
    
    res.json({ message: 'Sign up successful', username: newUser.username });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// ===== LOGIN =====
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    req.session.user = user;
    
    console.log('User logged in:', user.username, 'solved challenges:', user.solvedChallenges?.length);
    
    res.json({ message: 'Login successful', username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ===== LOGOUT =====
router.post('/logout', (req, res) => {
  const username = req.session.user?.username;
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    console.log('User logged out:', username);
    res.json({ message: 'Logged out' });
  });
});

// ===== GET ALL USERS (for leaderboard) =====
router.get('/users', async (req, res) => {
  try {
    console.log('Fetching users for leaderboard...');
    
    // Only return necessary data for leaderboard
    const users = await User.find({}, {
      username: 1,
      name: 1,
      joinDate: 1,
      solvedChallenges: 1,
      email: 1 // Include email for identification
    });
    
    console.log('Found users for leaderboard:', users.length);
    
    // Ensure each user has required fields
    const processedUsers = users.map(user => ({
      _id: user._id,
      id: user._id,
      username: user.username || user.name,
      name: user.username || user.name,
      email: user.email,
      joinDate: user.joinDate || new Date(),
      solvedChallenges: user.solvedChallenges || []
    }));
    
    res.json({ users: processedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// ===== UPDATE USER PROFILE =====
router.post('/update-profile', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { username, email, bio } = req.body;

    // Check if email is already used by another user
    if (email !== req.session.user.email) {
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: req.session.user._id } 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Check if username is already used by another user
    if (username !== req.session.user.username) {
      const usernameExists = await User.findOne({ 
        username, 
        _id: { $ne: req.session.user._id } 
      });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user._id,
      {
        username,
        name: username, // Keep name in sync with username
        email,
        bio
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update session
    req.session.user = updatedUser;

    console.log('Profile updated for user:', updatedUser.username);

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;