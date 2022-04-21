require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('./models/User.model');
const JwtStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt;
const cors = require('cors');

const app = express();
app.use(cors());
app.use(passport.initialize());
app.use(express.json());

mongoose.connect(process.env.MONGOLOGIN, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  if (err) console.error(err);
  else
    console.log('Connected to MongoDB');
});

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET;

passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
  User.findOne({ id: jwt_payload.id }, function (err, user) {
    if (err) {
      return done(err, false);
    }
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  });
}));

app.get('/', (req, res) => {
  res.json('Hello Tester, this is the starting point of the server. If you are seeing this then clearly assume that server is fully functional');
});

app.post('/login', (req, res) => {
  User.findOne({ email: req.body.email }, async (err, user) => {
    if (!user) {
      res.send({
        status: false,
        message: 'Authentication failed. User not found.'
      })
    } else {
      const isMatch = await user.comparePassword(req.body.password);
      if (!isMatch) {
        res.send({
          status: false,
          message: 'Authentication failed. Wrong password.'
        })
      } else {
        const token = jwt.sign({ user: user.email, _id: user._id }, process.env.SECRET);
        res.send({
          status: true,
          message: 'Authentication successful!',
          token: "Bearer " + token
        })
      }
    }
  })
})

app.post('/signup', (req, res) => {
  console.log("Came here")
  console.log(req.body);
  User.findOne({ email: req.body.email }, (err, user) => {
    if (user) {
      res.status(409).send({
        status: false,
        message: 'Username already exists'
      })
    } else {
      console.log("Came here too")
      const newUser = new User({
        email: req.body.email,
        password: req.body.password
      })
      newUser.save((err, user) => {
        if (err) {
          console.log(err)
          res.status(500).send({
            status: false,
            message: 'Something went wrong'
          })
        } else {
          console.log("Done this too");
          res.status(200).send({
            status: true,
            user: user.email
          })
        }
      })
    }
  })
})

app.get('/tokenvalidator', passport.authenticate('jwt', { session: false }), (req, res) => {
  return res.status(200).send({
    status: true,
    user: {
      _id: req.user._id,
      email: req.user.email
    }
  })
})

app.listen(4000, () => {
  console.log('Server is running on port 4000');
})