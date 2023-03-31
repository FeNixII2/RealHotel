const express = require("express");
const app = express();
const session = require("express-session");
const mysql = require("mysql");
const moment = require("moment");
const nodemailer = require("nodemailer");

// database connect setup
const con = mysql.createConnection({
  host: "25.19.244.218",
  // host: "localhost",
  user: "root",
  password: "",
  database: "hotel",
  connectTimeout: 100000,
});

con.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("database connected!");
  }
});

//app setup
app.use(express.static("public"));
app.use(express.static("public/icons"));
app.use(express.static("public/attraction"));
app.use(express.static("css"));
app.use(express.static("app"));
app.use(express.static("views"));
app.set("view engine", "ejs");
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

//port setting to run on the server
var port = 8080;
app.listen(port, () => {
  console.log("web start listening on port  : " + port);
});

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "testinghotel9@gmail.com", // your email
    pass: "123456789aA!", // your password
  },
});

app.get("/", (req, res) => {
  con.query("select * from roomstype", (err, datarooms) => {
    con.query(
      "select * from roomstype order by price asc",
      (err, roomstype) => {
        con.query("select * from payment", (err, payment_type) => {
          res.render("mainpage.ejs", { datarooms, roomstype, payment_type });
        });
      }
    );
  });
});
//js file include

require("./app/empty.js")(app, con);
require("./app/bookingsection.js")(app, con, moment, transporter); //js ของหน้า bookingsection
require("./app/roomsection.js")(app, con);//js ของหน้า roomsection

