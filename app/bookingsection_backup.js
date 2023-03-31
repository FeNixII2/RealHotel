module.exports = function(app, con, moment) {

    app.post("/booking_search", (req, res) => {
        var { checkin, checkout, roomtype } = req.body;

        const format = "DD-MM-YYYY";
        var checkin = moment(checkin, format);
        var checkout = moment(checkout, format);
        var search_daycount = checkout.diff(checkin, 'days');
        if (search_daycount == '0') {
            search_daycount += 1
        }
        var available_room = [];
        var available_type = [];

        if (roomtype != 'all') { // if user pick specific room type
            con.query("SELECT  num_room ,checkin,checkout,id_typeroom FROM reserved where id_typeroom ='" + roomtype + "'and status != '3'", (err, reserv_room) => {
                if (err) { console.log(err); }

                for (let i = 0; i < reserv_room.length; i++) {
                    available_room[i] = reserv_room[i].num_room;
                    available_type[i] = reserv_room[i].id_typeroom;
                }
                for (var i = 0; i < reserv_room.length; i++) {
                    var reserv_checkin = moment(reserv_room[i].checkin, format);
                    var reserv_checkout = moment(reserv_room[i].checkout, format);
                    const reserv_daycount = reserv_checkout.diff(reserv_checkin, 'days') + 1

                    for (var j = 0; j < reserv_daycount; j++) {

                        reserv_checkin2 = reserv_checkin.clone().add(j, 'day')
                        reserv_checkin2_str = reserv_checkin2.format(format)

                        for (var k = 0; k < search_daycount; k++) {

                            checkin2 = checkin.clone().add(k, 'day')
                            checkin2_str = checkin2.format(format)
                            if (checkin2.isSame(reserv_checkin2)) {
                                available_room[i] = ''
                                available_type[i] = ''
                                break;
                            }
                        }

                    }
                }
                // Remove empty strings
                available_room = available_room.filter(function(value) {
                    return value !== '';
                });

                available_type = available_type.filter(function(value) {
                    return value !== '';
                });

                // Sort the array in ascending order
                available_room.sort(function(a, b) {
                    return a - b;
                });
                available_type = available_type.filter(function(item, index) {
                    return available_type.indexOf(item) === index;
                });
                con.query("select * from roomstype order by price asc", (err, type_price) => {

                })
                res.send({ available_room, available_type, search_daycount })

            })
        } else if (roomtype == 'all') { // if user pick all room type
            con.query("SELECT  num_room ,checkin,checkout,id_typeroom FROM reserved where status != '3'", (err, reserv_room) => {
                if (err) { console.log(err); }


                for (let i = 0; i < reserv_room.length; i++) {
                    available_room.push({ num_room: reserv_room[i].num_room, type_room: reserv_room[i].id_typeroom });
                    available_type[i] = reserv_room[i].id_typeroom;
                }
                for (var i = 0; i < reserv_room.length; i++) {
                    var reserv_checkin = moment(reserv_room[i].checkin, format);
                    var reserv_checkout = moment(reserv_room[i].checkout, format);
                    const reserv_daycount = reserv_checkout.diff(reserv_checkin, 'days') + 1

                    for (var j = 0; j < reserv_daycount; j++) {

                        reserv_checkin2 = reserv_checkin.clone().add(j, 'day')
                        reserv_checkin2_str = reserv_checkin2.format(format)


                        for (var k = 0; k < search_daycount; k++) {

                            checkin2 = checkin.clone().add(k, 'day')
                            checkin2_str = checkin2.format(format)

                            if (checkin2.isSame(reserv_checkin2)) {
                                available_room[i].num_room = ''
                                available_room[i].type_room = ''
                                available_type[i] = ''
                                break;
                            }
                        }
                    }
                }
                // Remove empty strings
                available_room = available_room.filter(function(value) {
                    return value.num_room !== '';
                });

                available_type = available_type.filter(function(value) {
                    return value !== '';
                });
                // Sort the array in ascending order
                available_room.sort(function(a, b) {
                    return a - b;
                });
                available_type = available_type.filter(function(item, index) {
                    return available_type.indexOf(item) === index;
                });

                con.query("select * from roomstype order by price asc", (err, type_price) => {
                    var type_price_arr = []
                    for (let i = 0; i < type_price.length; i++) {
                        type_price_arr[i] = type_price[i].id;
                    }

                    // console.log(available_room, available_type);

                    res.send({ available_room, available_type, type_price_arr, search_daycount })

                })
            })
        }

    })

    app.post("/confirm_booking_room", (req, res) => {
        var { firstName, p_number, email, lastName, card_id, more_info, booking_room, checkin, checkout } = req.body
        const format = "DD-MM-YYYY";

        booking_room = booking_room.filter(function(value) {
            return value !== '';
        });

        booking_room = booking_room.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
        // console.log(booking_room);

        con.query("select * from customer where f_name = '" + firstName + "' and l_name = '" + lastName + "' and card_num ='" + card_id + "' and  p_num = '" + p_number + "' and email = '" + email + "'", (err, result) => {
            if (err) { console.log(err); }
            if (result == '') {
                con.query("insert into customer values ('','" + firstName + "','" + lastName + "','" + card_id + "','" + p_number + "','" + email + "')", (err, result) => {
                    if (err) { console.log(err); }
                    con.query("SELECT id FROM customer ORDER BY id DESC LIMIT 1", (err, id) => {
                        if (err) { console.log(err); }
                        con.query("SELECT  num_room ,checkin,checkout,id_typeroom FROM reserved where status != '3'", (err, reserv_room) => {
                            if (err) { console.log(err); }
                            // console.log(reserv_room);
                            const values = Object.values(booking_room);
                            available_room = []
                            count = 0;

                            checkin = moment(checkin, format);
                            checkout = moment(checkout, format);
                            var search_daycount = checkout.diff(checkin, 'days') + 1;

                            for (const type in booking_room) {
                                matchingRooms = reserv_room.filter(room => type.includes(room.id_typeroom));
                                var available = true;
                                // console.log(matchingRooms);
                                for (let value_index = 0; value_index < values[count]; value_index++) {
                                    for (var i = 0; i < matchingRooms.length; i++) {
                                        var matching_checkin = moment(matchingRooms[i].checkin, format);
                                        var matching_checkout = moment(matchingRooms[i].checkout, format);
                                        var reserv_daycount = matching_checkout.diff(matching_checkin, 'days') + 1

                                        for (var j = 0; j < reserv_daycount; j++) {
                                            // console.log(type, values[count], reserv_daycount, available_room);

                                            matching_checkin2 = matching_checkin.clone().add(j, 'day')
                                            matching_checkin_str = matching_checkin2.format(format)
                                                // console.log(matchingRooms[i], matching_checkin_str, '+', j);
                                            for (var k = 0; k < search_daycount; k++) {
                                                // console.log(search_daycount);
                                                checkin2 = checkin.clone().add(k, 'day')
                                                checkin2_str = checkin2.format(format)
                                                    // console.log(matchingRooms[i].num_room, matching_checkin_str, checkin2_str, k);

                                                if (checkin2.isSame(matching_checkin2)) {
                                                    available = false
                                                    break;
                                                }
                                                // console.log(k + '==' + (search_daycount - 1) + '&&' + available + '==' + true);

                                            }
                                            if (available == true) {
                                                typeCount = countObjectsWithPropertyValue(available_room, 'type', type, values[count]);
                                                if (typeCount < values[count]) {
                                                    const isDuplicate = available_room.some(obj => obj.type === type && obj.room_number === matchingRooms[i].num_room);
                                                    if (!isDuplicate) {
                                                        // console.log('inif');
                                                        available_room.push({ type: type, room_number: matchingRooms[i].num_room, checkin: checkin.clone().format(format), checkout: checkout.clone().format(format) })
                                                    }
                                                }
                                            }
                                        }
                                    }

                                }
                                count++
                            }
                            // console.log(available_room);
                            for (let i = 0; i < available_room.length; i++) {
                                const data = available_room[i];
                                con.query("select id from customer where f_name = '" + firstName + "' and l_name = '" + lastName + "' and card_num ='" + card_id + "' and  p_num = '" + p_number + "' and email = '" + email + "'", (err, id) => {
                                    if (err) throw err;
                                    con.query("INSERT INTO reserved VALUES ('', ?, ?, ?, ?, '1', ?,?)", [data.room_number, data.type, data.checkin, data.checkout, id[0].id, more_info], (err, results) => {
                                        if (err) throw err;
                                    });
                                })
                            }
                        })
                    })
                })
            } else {

            }
        })



    })

    function countObjectsWithPropertyValue(arr, property, value, maxCount) {
        const count = arr.reduce((acc, obj) => {
            if (obj[property] === value && acc < maxCount) {
                acc++;
            }
            return acc;
        }, 0);
        return count;
    }
}