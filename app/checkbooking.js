module.exports = function (app, con, moment, transporter) {
    app.post("/get_booking_code", (req, res) => {
        var { code } = req.body
        con.query(`select reserved_id from reserved where reserved_id ='${code}' and status in (0,1) `, (err, result) => {
            if (err) throw err
            if (result.length > 0) {
                res.send({ result })
            }
        })
    })

    app.post("/get_reserv_info", (req, res) => {
        var { code, phoneNumber } = req.body
        con.query(`select reserved.*,customer.*,RIGHT(customer.p_num, 4) AS digit ,roomstype.name,roomstype.name_th,roomstype.price from reserved LEFT JOIN customer ON reserved.cus_id=customer.id LEFT JOIN roomstype ON reserved.id_typeroom = roomstype.id where reserved_id ='${code}' and status in (0,1)  AND RIGHT(p_num, 4) = '${phoneNumber}' `, (err, reserv_info) => {

            if (err) throw err
            res.send({ reserv_info })
        })
    })

};