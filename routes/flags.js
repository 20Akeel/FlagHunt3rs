const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const User = require('../models/User');

const correctFlags = {
  'easy-1':  'flag{typ3_c03rc10n_m4gic}',
  'easy-2':  'flag{b4se64_d3c0d3d_m3}',
  'medium-1':'flag{h1dd3n_js_fl4g}',
  'medium-2':'flag{sql_1nj3ct10n_succ3ss}',
  'medium-3':'flag{c00k13_m0nst3r_4dm1n}',
  'hard-1':  'flag{xss_vu1n3r4b1l1ty_f0und}',
  'hard-2':  'flag{Adv4nc3d_byp4ss_m4st3r}'
};

const challengePoints = {
  'easy-1': 100, 'easy-2': 150,
  'medium-1': 200, 'medium-2': 250, 'medium-3': 300,
  'hard-1': 400, 'hard-2': 500,
};

function clean(s) {
  return String(s ?? '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

router.post('/submit', async (req, res) => {
  console.log('Flag submission received:', req.body); // Debug log
  
  try {
    const challengeId   = clean(req.body.challengeId ?? req.body.challenge);
    const submittedFlag = clean(req.body.submittedFlag ?? req.body.flag);
    const playerName    = clean(req.body.username ?? req.body.name ?? 'anonymous');
    const email         = clean(req.body.email ?? '');
    const hintDeductions = Math.max(0, Number(req.body.hintDeductions ?? 0));

    console.log('Processed data:', { challengeId, submittedFlag, playerName, email, hintDeductions });

    if (!challengeId || !playerName || !submittedFlag) {
      return res.status(400).json({ success: false, message: 'Missing required fields', points: 0 });
    }
    
    if (!(challengeId in correctFlags)) {
      return res.status(400).json({ success: false, message: 'Unknown challenge', points: 0 });
    }

    const isCorrect = (submittedFlag === correctFlags[challengeId]);
    const base = Number(challengePoints[challengeId] ?? 0);
    const points = isCorrect ? Math.max(0, base - hintDeductions) : 0;

    console.log('Flag check result:', { isCorrect, points });

    // Log every attempt in Player collection
    await Player.create({
      name: playerName,
      challengeId,
      submittedFlag,
      isCorrect,
      timestamp: new Date(),
    });

    // Only update User collection for correct answers
    if (isCorrect) {
      try {
        let user;
        
        // First, try to find by session user if available
        if (req.session && req.session.user) {
          user = await User.findById(req.session.user._id);
          console.log('Found user from session:', user?.username);
        }
        
        // If no session user, try to find by email or username
        if (!user) {
          if (email) {
            user = await User.findOne({ email });
            console.log('Found user by email:', user?.username);
          } else {
            user = await User.findOne({ username: playerName });
            console.log('Found user by username:', user?.username);
          }
        }

        if (user) {
          // Check if this challenge is already solved
          const alreadySolved = user.solvedChallenges?.some(
            solved => solved.challengeId === challengeId
          );

          if (alreadySolved) {
            return res.status(200).json({ 
              success: true, 
              points: 0, 
              message: 'Challenge already solved!' 
            });
          }

          // Add the solved challenge
          const solvedChallenge = {
            challengeId,
            flag: submittedFlag,
            points,
            timestamp: new Date()
          };

          user.solvedChallenges = user.solvedChallenges || [];
          user.solvedChallenges.push(solvedChallenge);
          
          await user.save();
          console.log('Updated user with solved challenge:', user.username);

          // Update session if exists
          if (req.session && req.session.user) {
            req.session.user = user;
          }

        } else {
          // Create new user if not found
          console.log('Creating new user:', playerName);
          
          const newUser = new User({
            username: playerName,
            name: playerName,
            email: email || undefined,
            solvedChallenges: [{
              challengeId,
              flag: submittedFlag,
              points,
              timestamp: new Date()
            }]
          });

          await newUser.save();
          console.log('Created new user:', newUser.username);
        }

      } catch (userError) {
        console.error('Error updating user:', userError);
        // Don't fail the whole request if user update fails
        return res.status(200).json({ 
          success: true, 
          points, 
          message: 'Flag correct but profile update failed' 
        });
      }
    }

    if (isCorrect) {
      console.log('Sending success response with points:', points);
      return res.status(200).json({ 
        success: true, 
        points,
        message: 'Correct flag!' 
      });
    }

    console.log('Sending failure response');
    return res.status(200).json({ 
      success: false, 
      message: 'Incorrect flag.', 
      points: 0 
    });

  } catch (err) {
    console.error('Flag submit error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      points: 0 
    });
  }
});

module.exports = router;