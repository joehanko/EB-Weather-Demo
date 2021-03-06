const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const app = express();

// An API Key is required - you can get this from https://openweathermap.org
// NOTE: You'll need to wait approximately 20-30 mins for the API key to be activated, so hold tight!
const apiKey = " YOURAPIKEY ";

app.set('port', (process.env.PORT || 8081));

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");

app.get("/", function(req, res) {
  res.render("index", { weather: null, error: null });
});

app.post("/", function(req, res) {
  // let city = req.body.city;
  let lat = req.body.lat;
  let lon = req.body.lon;
  // let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`;
  let url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
  
  request(url, function(err, response, body) {
    if (err) {
      res.render("index", { weather: null, error: "Error, please try again" });
    } else {
      let weather = JSON.parse(body);
      if (weather.main == undefined) {
        res.render("index", {
          weather: null,
          error: "Error, please try again"
        });
      } else {
        let weatherText = `It's ${weather.main.temp} degrees at ${lat}, ${lon} (${weather.name}).`;
        res.render("index", { weather: weatherText, error: null });
      }
    }
  });
});

var server = app.listen(8081, function () {
  var port = server.address().port
  console.log("App listening on port", port);
});
