module.exports = function (app, con, moment, transporter) {
    app.post("/booking_search", (req, res) => {

        var { checkin, checkout, roomtype } = req.body;
        if (roomtype != 'all') {
            con.query(`select id from roomstype where name = '${roomtype}' `, (err, roomTypeResults) => {
                if (err) throw err
                const roomTypeIds = roomTypeResults.map(roomType => roomType.id);
                // const placeholders = roomTypeIds.map(() => '?').join(',');
                // console.log(roomTypeIds);

                con.query(`SELECT COUNT(*) as count_available_rooms, id_typeroom FROM rooms WHERE id_typeroom IN (?) AND num_room NOT IN (SELECT num_room FROM reserved WHERE id_typeroom IN (?) AND (checkin BETWEEN ? AND ? OR checkout BETWEEN ? AND ? OR (checkin <= ? AND checkout >= ?)) AND status NOT IN ('4', '5')) GROUP BY id_typeroom`, [roomTypeIds, roomTypeIds, checkin, checkout, checkin, checkout, checkin, checkout], (err, results) => {
                    if (err) throw err;
                    con.query("SELECT roomtype_facility.id,roomtype_facility.room_type_id, roomtype_facility.facility_id ,facility.name , facility.type_id , facility.class , facility.class_nameicon  FROM roomtype_facility JOIN facility ON roomtype_facility.facility_id = facility.id JOIN roomstype ON roomstype.id = roomtype_facility.room_type_id order by roomtype_facility.room_type_id asc , facility.id  asc", (err, allfacility) => {
                        // console.log(allfacility);
                        if (err) throw err;

                        con.query(`SELECT roomstype.id, roomstype.name, roomstype.name_th,
                        roomstype.bed, roomstype.price, roomstype.size, roomstype.count_humen, roomstype.type_bed ,roomstype.size_bed ,roomstype.extional
                        , img_roomstype.img
                         from roomstype LEFT JOIN img_roomstype on roomstype.id = img_roomstype.roomstype_id where roomstype.id IN (?) order by roomstype.price ASC`, [roomTypeIds], (err, dataroomstype) => {

                            if (err) throw err;
                            const sub_imgroom = dataroomstype.map(item => ({
                                id: item.id,
                                img: item.img
                            }));
                            // console.log(sub_imgroom);

                            const data_room = dataroomstype.reduce((result, item) => {
                                if (!result[item.id]) {
                                    result[item.id] = item;
                                    delete result[item.id].img; // Exclude name_th property
                                }
                                return result;
                            }, {});

                            const roomtype = Object.values(data_room);
                            roomtype.sort((a, b) => a.price - b.price);
                            // console.log(roomtype);


                            const data_allfacility = allfacility.map(item => ({
                                roomtype_id: item.room_type_id,
                                name: item.name,
                                classicon: item.class,
                                classnameicon: item.class_nameicon

                            }));

                            // console.log(allfacility);
                            // console.log(data_allfacility);


                            const count_available_rooms = results.reduce((acc, curr) => acc + curr.count_available_rooms, 0);
                            const success = count_available_rooms > 0;
                            res.send({ success, count_available_rooms: results, sub_imgroom, roomtype, allfacility, data_allfacility, })
                        });

                    });
                });

            })
        } else if (roomtype == 'all') {
            con.query("SELECT COUNT(*) as count_available_rooms, id_typeroom FROM rooms WHERE num_room NOT IN (SELECT num_room FROM reserved WHERE (checkin BETWEEN ? AND ? OR checkout BETWEEN ? AND ? OR (checkin <= ? AND checkout >= ?))and status NOT IN ('4', '5')) GROUP BY id_typeroom", [checkin, checkout, checkin, checkout, checkin, checkout], (err, results) => {
                if (err) throw err;
                con.query("SELECT roomtype_facility.id,roomtype_facility.room_type_id, roomtype_facility.facility_id ,facility.name , facility.type_id , facility.class , facility.class_nameicon  FROM roomtype_facility JOIN facility ON roomtype_facility.facility_id = facility.id JOIN roomstype ON roomstype.id = roomtype_facility.room_type_id order by roomtype_facility.room_type_id asc , facility.id  asc", (err, allfacility) => {
                    if (err) throw err;
                    con.query("select * from roomstype order by price asc", (err, roomtype) => {
                        if (err) throw err;
                        const countAvailableRooms = results.reduce((acc, curr) => acc + curr.count_available_rooms, 0);
                        const success = countAvailableRooms > 0;
                        res.send({ success, count_available_rooms: results, roomtype, allfacility });
                    })
                });
            });
        }
    })


    app.post('/confirm_booking_room', (req, res) => {
        var { firstName, p_number, email, lastName, more_info, payment, checkin, checkout, room_type, totalprice, country, checkboxData } = req.body

        con.query("select id from customer where f_name = ? and l_name = ? and p_num = ? and email = ?", [firstName, lastName, p_number, email], (err, cus_id) => {
            if (err) throw err
            if (cus_id.length != 0) {

                reserv(more_info, payment, checkin, checkout, room_type, cus_id[0].id, totalprice, checkboxData, function (reserved_custom_id) {
                    // console.log("Reserved custom ID:", reserved_custom_id);
                    res.send({ reserved_custom_id })
                });
            } else if (cus_id.length == 0) {
                con.query("insert into customer values ('',?,?,?,?,?)", [firstName, lastName, p_number, email, country], (err, cus_id) => {
                    var cus_id = cus_id.insertId
                    if (err) throw err
                    reserv(more_info, payment, checkin, checkout, room_type, cus_id, totalprice, checkboxData, function (reserved_custom_id) {
                        // console.log("Reserved custom ID:", reserved_custom_id);
                        res.send({ reserved_custom_id })
                    });

                })
            }
        })
    })

    function reserv(more_info, payment, checkin, checkout, room_type, cus_id, totalprice, checkboxData, callback) {


        const currentDate = moment();
        const formattedDate = currentDate.format('DD/MM/YYYY HH:mm');
        con.query("SELECT num_room FROM rooms WHERE id_typeroom = ? AND num_room NOT IN (SELECT num_room FROM reserved WHERE id_typeroom = ? AND checkin BETWEEN ? AND ? AND checkout BETWEEN ? AND ? AND status NOT IN(4,5)) LIMIT 1", [room_type, room_type, checkin, checkout, checkin, checkout], (err, num_room) => {
            if (err) throw err
            var reserved_custom_date = currentDate.format('DMYYHmm')
            var reserved_custom_id = 'SF' + cus_id + reserved_custom_date
            var booking_date = currentDate.format('DD-MM-YYYY')
            con.query("insert into reserved (num_room,id_typeroom,checkin,checkout,cus_id, more_info, payment,reserved_id,total_price,date,status) values (?,?,?,?,?,?,?,?,?,?,0) ", [num_room[0].num_room, room_type, checkin, checkout, cus_id, more_info, payment, reserved_custom_id, totalprice, booking_date], (err, result) => {


                if (err) throw err
                con.query(`insert into payment_log (reserv_code,total_price,payment_type,status,cus_id) values ('${reserved_custom_id}','${totalprice}','${payment}','1','${cus_id}')`, (err, result) => {
                    if (err) throw err
                    checkboxData.forEach(function (data) {
                        var checkboxId = data.id;
                        var sql = "INSERT INTO reserved_service (reserved_id, service_id ) VALUES (?, ?)";
                        var values = [reserved_custom_id, checkboxId];
                        con.query(sql, values, function (err, result) {
                            if (err) {
                                console.error('Error inserting data: ' + err.stack);
                                return;
                            }
                        });
                    });
                    callback(reserved_custom_id);
                })
            })

        })
    }
}