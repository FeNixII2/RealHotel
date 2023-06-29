const express = require("express");
const app = express();
const session = require("express-session");
const mysql = require("mysql");
const moment = require("moment");
const nodemailer = require("nodemailer");

// database connect setup
const con = mysql.createConnection({
    // host: "25.19.244.218",
    host: "localhost",
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
app.use(express.static("public/deluxe"));
app.use(express.static("public/rechotel"));
app.use(express.static("public/standard"));
app.use(express.static("public/superior"));
app.use(express.static("public/suite"));
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
    con.query("SELECT mr.*,imr.img from main_roomtype AS mr LEFT JOIN  img_main_roomtype AS imr ON mr.id = imr.main_roomtype_id ", (err, datarooms) => {
        if (err) throw err
        const recroom_img = datarooms.map(item => ({
            name: item.name,
            img: item.img
        }));



        const recroom_data = datarooms.reduce((result, item) => {
            if (!result[item.name]) {
                result[item.name] = item;
                delete result[item.name].img; // Exclude name_th property
            }
            return result;
        }, {});
        // Convert the grouped data object back to an array
        const recroom_type = Object.values(recroom_data);

        // console.log(recroom_img);
        // console.log(recroom_type);

        con.query(
            "select name,name_th from roomstype group by name order by price asc",
            (err, roomstype) => {
                con.query("select * from payment ", (err, payment_type) => {
                    con.query("SELECT room_service.roomtype_id AS room_id, room_service.service_id, service.name ,service.price ,service.iconclass , service.iconname  FROM room_service LEFT JOIN service ON  service.id = room_service.service_id ORDER BY room_service.roomtype_id ASC ,room_service.service_id asc", (err, services) => {
                        res.render("mainpage.ejs", { recroom_type, recroom_img, roomstype, payment_type, services });
                    });
                });
            }
        );
    });
});
//js file include

require("./app/empty.js")(app, con);
require("./app/bookingsection.js")(app, con, moment, transporter); //js ของหน้า bookingsection
require("./app/roomsection.js")(app, con); //js ของหน้า roomsection
require("./app/checkbooking.js")(app, con); //js ของหน้า checkbooking