module.exports = function (app, con, moment, transporter) {
    app.post("/checkbooking", (req, res) => {
        console.log("in post /checkbooking");
        var { idnumcheckbooking } = req.body;
        console.log("in post /checkbooking");
        if (idnumcheckbooking == "") {
            console.log("not have");
        } else {
            console.log("have");
            con.query("select * from reserved JOIN customer ON reserved.cus_id = customer.id JOIN roomstype ON roomstype.id = reserved.id_typeroom WHERE ? = customer.p_num OR ? = reserved.reserved_id ORDER BY reserved.`status` asc", [idnumcheckbooking, idnumcheckbooking], (err, allbooking) => {
                if (err) throw err

                res.send({ success: true, allbooking })






            });
        }

    });
};