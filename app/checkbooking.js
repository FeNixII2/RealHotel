module.exports = function (app, con, moment, transporter) {
    app.post("/get_booking_code", (req, res) => {
        var { code } = req.body
        con.query(`select reserved_id from reserved where reserved_id ='${code}' `, (err, result) => {
            if (err) throw err
            if (result.length > 0) {
                res.send({ result })
            }
        })
    })

    // app.post("/checkbooking", (req, res) => {
    //     var { idnumcheckbooking } = req.body;
    //     var allbooking
    //     if (idnumcheckbooking == "") {
    //         res.send({ success: false, allbooking })
    //         // console.log("not have");
    //     } else {
    //         // console.log("have");
    //         con.query("select * from reserved JOIN customer ON reserved.cus_id = customer.id JOIN roomstype ON roomstype.id = reserved.id_typeroom WHERE ? = customer.p_num OR ? = reserved.reserved_id ORDER BY reserved.`status` asc", [idnumcheckbooking, idnumcheckbooking], (err, allbooking) => {
    //             if (err) throw err
    //             // console.log(allbooking);
    //             res.send({ success: true, allbooking })

    //         });
    //     }

    // });

};