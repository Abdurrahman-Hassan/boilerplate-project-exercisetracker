const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

mongoose.connect(
  "mongodb+srv://Abdur:test@cluster0.ykgeoc0.mongodb.net/?retryWrites=true&w=majority"
);

const user = new mongoose.Schema({
  username: String,
});
const User = mongoose.model("User", user);

const exercise = new mongoose.Schema({
  userid: String,
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", exercise);

const log = new mongoose.Schema({
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});
const Log = mongoose.model("Log", log);

app.get("/api/users/", (req, res) => {
  console.log(req.body);
  User.find()
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      console.error("Error retrieving users:", err);
    });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    let userId = req.params._id;
    let from = req.query.from;
    let to = req.query.to;
    let limit = req.query.limit;

    let query = { userid: userId }; // Initial query with the user ID

    // Add conditions for 'from' and 'to' if they are present in the query parameters
    if (from && to) {
      query.date = { $gte: new Date(from), $lt: new Date(to) };
    } else if (from) {
      query.date = { $gte: new Date(from) };
    } else if (to) {
      query.date = { $lt: new Date(to) };
    }

    let exerciseQuery = Exercise.find(query);

    // Apply limit only if 'limit' parameter is present
    if (limit) {
      exerciseQuery = exerciseQuery.limit(parseInt(limit));
    }

    const exercises = await exerciseQuery.exec();

    // Format the date in each exercise object using toISOString()
    const formattedExercises = exercises.map((exercise) => ({
      _id: exercise._id,
      userid: exercise.userid,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(), // Format date to ISO string
      __v: exercise.__v,
    }));

    res.json({ count: formattedExercises.length, log: formattedExercises });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/users/:_id/exercises", (req, res) => {
  console.log(req.body);
  let _id = req.params._id;

  let date = new Date().toDateString();
  let data = req.body;
  let exercise = new Exercise({
    userid: req.params._id,
    description: data.description,
    duration: data.duration,
    date: data.date ? data.date : date,
  });
  exercise
    .save()
    .then((savedUser) => {
      User.findById(_id).then((user) => {
        res.status(200).json({ user, exercise: savedUser });
        console.log("User saved successfully:", { user, exercise: savedUser });
      });
    })
    .catch((error) => {
      console.error("Error saving user:", error);
    });
});
app.post("/api/users", (req, res) => {
  let username = req.body.username;
  let user = new User({
    username,
  });
  user
    .save()
    .then((savedUser) => {
      console.log("User saved successfully:", savedUser);
      res
        .status(200)
        .json({ username: savedUser.username, _id: savedUser._id });
    })
    .catch((error) => {
      console.error("Error saving user:", error);
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
