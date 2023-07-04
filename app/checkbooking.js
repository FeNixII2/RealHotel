module.exports = function (app, con, moment, transporter) {
    app.post("/get_booking_code", (req, res) => {
        var { code } = req.body
        con.query(`select reserved_id from reserved where reserved_id ='${code}' and status in (0,1)`, (err, result) => {
            console.log(result);
            if (err) throw err
            if (result.length > 0) {
                res.send({ result })
            } else {

                res.send({ result })
            }
        })
    })

    app.post("/get_reserv_info", (req, res) => {
        var { code, phoneNumber } = req.body
        con.query(`select reserved.*,customer.*,RIGHT(customer.p_num, 4) AS digit
        ,roomstype.name,roomstype.name_th,roomstype.price,roomstype.bed,roomstype.size
        ,roomstype.count_humen,roomstype.extional,payment.pay_type,reserved_status.status_name,reserved_status.status_colorclass from reserved
        LEFT JOIN customer ON reserved.cus_id=customer.id
        LEFT JOIN roomstype ON reserved.id_typeroom = roomstype.id
        LEFT JOIN payment ON reserved.payment = payment.id
        LEFT JOIN reserved_status ON reserved.status = reserved_status.status_id
         where reserved_id ='${code}'
        and status in (0,1)  AND RIGHT(p_num, 4) = '${phoneNumber}'`, (err, reserv_info) => {
            if (err) throw err
            con.query(`SELECT service.name,service.price FROM reserved_service LEFT JOIN service ON reserved_service.service_id=service.id  WHERE reserved_id = '${code}'`, (err, showservice) => {
                if (err) throw err
                res.send({ reserv_info, showservice });
            });
        });
    });
};