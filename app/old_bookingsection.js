module.exports = function (app, con, moment, transporter) {
  app.post("/booking_search", (req, res) => {
    var { checkin, checkout, roomtype } = req.body;

    const format = "DD-MM-YYYY";
    var checkin = moment(checkin, format);
    var checkout = moment(checkout, format);
    var search_daycount = checkout.diff(checkin, "days");

    if (roomtype != "all") {
      con.query(
        "select * from reserved where id_typeroom = ? ", [roomtype],
        (err, reserv_room) => {
          if (err) throw err;
          if (reserv_room == "") {
            con.query(
              "select * from roomstype where id = ?", [roomtype],
              (err, type_info) => {
                if (err) throw err;
                res.send({
                  display_style: "specific",
                  type_info,
                  search_daycount,
                });
              }
            );
          } else if (reserv_room != "") {
            con.query(
              "select * from rooms where id_typeroom = ?", [roomtype],
              (err, room) => {
                if (err) throw err;
                const mismatched = room.filter(
                  (item) =>
                    !reserv_room.some((r) => r.num_room === item.num_room)
                );

                if (mismatched != "") {
                  con.query(
                    "select * from roomstype where id = ?", [roomtype],
                    (err, type_info) => {
                      if (err) throw err;
                      res.send({
                        display_style: "specific",
                        type_info,
                        search_daycount,
                      });
                    }
                  );
                } else if (mismatched == "") {
                  var available = Boolean;
                  for (let i = 0; i < reserv_room.length; i++) {
                    var reserv_room2 = reserv_room[i];
                    var reserv_checkin = moment(reserv_room2.checkin, format);
                    var reserv_out = moment(reserv_room2.checkout, format);
                    var reserv_daycount = reserv_out.diff(
                      reserv_checkin,
                      "days"
                    );

                    for (let j = 0; j < reserv_daycount; j++) {
                      reserv_checkin2 = reserv_checkin.clone().add(j, "day");
                      reserv_checkin2_str = reserv_checkin2.format(format);

                      for (let k = 0; k < search_daycount; k++) {
                        checkin2 = checkin.clone().add(k, "day");
                        checkin2_str = checkin2.format(format);
                        // console.log(reserv_checkin2_str + '  ' + checkin2_str);

                        if (checkin2.isSame(reserv_checkin2)) {
                          available = false;
                          break;
                        } else if (!checkin2.isSame(reserv_checkin2)) {
                          available = true;
                        }
                      }
                    }
                  }
                  if (available == true) {
                    if (err) throw err;
                    con.query(
                      "select * from roomstype where id = ?", [roomtype],
                      (err, type_info) => {
                        res.send({
                          display_style: "specific",
                          type_info,
                          search_daycount,
                        });
                      }
                    );
                  } else if (available == false) {
                    res.send({
                      display_style: "specific",
                      type_info: "",
                      search_daycount,
                    });
                  }
                }
              }
            );
          }
        }
      );
    } else if (roomtype == "all") {
      con.query("select * from reserved ", (err, reserv_room) => {
        if (err) throw err;
        if (reserv_room == "") {
          con.query("select * from roomstype", (err, type_info) => {
            if (err) throw err;
            res.send({ display_style: "all", type_info, search_daycount });
          });
        } else if (reserv_room != "") {
          con.query("select * from rooms", (err, room) => {
            if (err) throw err;
            var mismatched = room.filter(
              (item) => !reserv_room.some((r) => r.num_room === item.num_room)
            );

            for (let i = 0; i < reserv_room.length; i++) {
              var reserv_room2 = reserv_room[i];
              var reserv_checkin = moment(reserv_room2.checkin, format);
              var reserv_checkout = moment(reserv_room2.checkout, format);
              var reserv_daycount = reserv_checkout.diff(
                reserv_checkin,
                "days"
              );

              for (let j = 0; j < reserv_daycount; j++) {
                reserv_checkin2 = reserv_checkin.clone().add(j, "day");
                reserv_checkin2_str = reserv_checkin2.format(format);
              }

              for (let k = 0; k < search_daycount; k++) {
                checkin2 = checkin.clone().add(k, "day");
                checkin2_str = checkin2.format(format);
                if (checkin2.isSame(reserv_checkin2)) {
                  available = false;
                  break;
                } else if (!checkin2.isSame(reserv_checkin2)) {
                  available = true;
                }
              }
              if (available == true) {
                mismatched.push(reserv_room[i]);
              }
            }

            mismatched = mismatched.map((mismatched) => ({
              id_typeroom: mismatched.id_typeroom,
            }));

            mismatched = mismatched.filter(
              (room, index, self) =>
                index ===
                self.findIndex((r) => r.id_typeroom === room.id_typeroom)
            );

            con.query(
              "select * from roomstype order by price asc",
              (err, type_info) => {
                type_info = type_info.filter((price) => {
                  return mismatched.some(
                    (m) => m.id_typeroom === price.id.toString()
                  );
                });
                res.send({ display_style: "all", type_info, search_daycount });
              }
            );
          });
        }
      });
    }
  });

  app.post("/confirm_booking_room", (req, res) => {
    var {
      firstName,
      p_number,
      email,
      lastName,
      card_id,
      more_info,
      booking_room,
      checkin,
      checkout,
      selectedOptionId,
    } = req.body;

    booking_room = booking_room.filter((str) => str !== "");
    // console.log(booking_room);
    const format = "DD-MM-YYYY";
    var checkin = moment(checkin, format);
    var checkout = moment(checkout, format);
    var search_daycount = checkout.diff(checkin, "days");
    var available = Boolean;
    var available_room = [];

    con.query(
      "select id from customer where f_name = '" +
      firstName +
      "' and l_name = '" +
      lastName +
      "' and card_num ='" +
      card_id +
      "' and  p_num = '" +
      p_number +
      "' and email = '" +
      email +
      "'",
      (err, id) => {
        if (id == "") {
          console.log("inside confirm_id_null");
          confirm_id_null();
          // send_email()
        } else if (id != "") {
          console.log("inside confirm_id_not_null");
          confirm_id_not_null();
          // send_email()
        }
      }
    );

    function confirm_id_null() {
      // Wrap queries in promises
      const getRoomInfo = (id_typeroom, num_room) => {
        return new Promise((resolve, reject) => {
          con.query(
            "select * from rooms where id_typeroom=?", [id_typeroom],
            (err, room_info) => {
              if (err) return reject(err);
              resolve(room_info);
            }
          );
        });
      };

      const getReservedRooms = (num_room) => {
        return new Promise((resolve, reject) => {
          con.query(
            "select * from reserved where num_room = ?", [num_room],
            (err, reserv_room) => {
              if (err) return reject(err);
              resolve(reserv_room);
            }
          );
        });
      };

      // Loop over booking_room array and run queries for each
      Promise.all(
        booking_room.map((id_typeroom) => {
          return getRoomInfo(id_typeroom).then((room_info) => {
            return Promise.all(
              room_info.map((room) => {
                return getReservedRooms(room.num_room).then((reserv_room) => {
                  if (reserv_room.length === 0) {
                    available_room.push(room);
                  } else {
                    let available = true;
                    const reserv_checkin = moment(
                      reserv_room[0].checkin,
                      format
                    );
                    const reserv_checkout = moment(
                      reserv_room[0].checkout,
                      format
                    );
                    const reserv_daycount = reserv_checkout.diff(
                      reserv_checkin,
                      "days"
                    );

                    for (
                      let reserv_date_index = 0; reserv_date_index < reserv_daycount; reserv_date_index++
                    ) {
                      reserv_checkin2 = reserv_checkin
                        .clone()
                        .add(reserv_date_index, "day");
                      reserv_checkin2_str = reserv_checkin2.format(format);

                      for (
                        let checkin_index = 0; checkin_index < search_daycount; checkin_index++
                      ) {
                        checkin2 = checkin.clone().add(checkin_index, "day");

                        if (checkin2.isSame(reserv_checkin2)) {
                          available = false;
                          break;
                        } else if (!checkin2.isSame(reserv_checkin2)) {
                          available = true;
                        }
                      }
                    }
                    if (available) {
                      available_room.push(room);
                    }
                  }
                });
              })
            );
          });
        })
      )
        .then(() => {
          available_room = available_room.reduce((acc, obj) => {
            const found = acc.some((item) => item.id === obj.id);
            if (!found) {
              acc.push(obj);
            }
            return acc;
          }, []);
          // console.log(available_room);

          var booked = [];

          for (let i = 0; i < booking_room.length; i++) {
            for (let j = 0; j < available_room.length; j++) {
              if (available_room[j].id_typeroom == booking_room[i]) {
                booked.push(available_room[j]);
                available_room.splice(j, 1);
                break;
              }
            }
          }
          // console.log(booked);
          con.query(
            "insert into customer value ('',?,?,?,?,?)", [firstName, lastName, card_id, p_number, email],
            (err, result) => {
              if (err) throw err;
              con.query(
                "select id from customer where f_name = '" +
                firstName +
                "' and l_name = '" +
                lastName +
                "' and card_num ='" +
                card_id +
                "' and  p_num = '" +
                p_number +
                "' and email = '" +
                email +
                "'",
                (err, id) => {
                  if (err) throw err;
                  for (var i = 0; i < booked.length; i++) {
                    var booked2 = booked[i];
                    checkin2 = checkin.clone().format(format);
                    checkout2 = checkout.clone().format(format);
                    con.query(
                      "insert into reserved value ('',?,?,?,?,'0',?,?,?)", [
                      booked2.num_room,
                      booked2.id_typeroom,
                      checkin2,
                      checkout2,
                      id[0].id,
                      more_info,
                      selectedOptionId,
                    ],
                      (err, result) => {
                        if (err) {
                          console.log(err);
                        } else {
                          var payment_detail =
                            "จองห้อง" +
                            booked2.num_room +
                            "จ่ายด้วยวิธี" +
                            selectedOptionId +
                            "วันที่" +
                            moment().format(format);
                          con.query(
                            "insert into payment_log value ('',?,?)", [payment_detail, id[0].id],
                            (err, result) => {
                              if (err) throw err;
                              booking_success = true;
                            }
                          );
                        }
                      }
                    );
                  }
                }
              );
            }
          );
          // if (booking_success == true) {
          res.send({ success: "success" });
          // let booked_success = {
          //     from: 'testinghotel9@gmail.com', // sender address
          //     to: email, // list of receivers
          //     subject: 'Booking Confirmation', // Subject line
          //     text: 'Dear Customer, Thank you for booking our hotel room. Your booking has been confirmed. We look forward to welcoming you to our hotel.', // plain text body
          // };

          // transporter.sendMail(booked_success, function (error, info) {
          //     if (error) {
          //         console.log(error);
          //     } else {
          //         console.log('Email sent: ' + info.response);
          //     }
          // });
          // }
        })
        .catch((err) => {
          console.error(err);
        });
    }

    function confirm_id_not_null() {
      // Wrap queries in promises
      const getRoomInfo = (id_typeroom, num_room) => {
        return new Promise((resolve, reject) => {
          con.query(
            "select * from rooms where id_typeroom=?", [id_typeroom],
            (err, room_info) => {
              if (err) return reject(err);
              resolve(room_info);
            }
          );
        });
      };

      const getReservedRooms = (num_room) => {
        return new Promise((resolve, reject) => {
          con.query(
            "select * from reserved where num_room = ?", [num_room],
            (err, reserv_room) => {
              if (err) return reject(err);
              resolve(reserv_room);
            }
          );
        });
      };

      // Loop over booking_room array and run queries for each
      Promise.all(
        booking_room.map((id_typeroom) => {
          return getRoomInfo(id_typeroom).then((room_info) => {
            return Promise.all(
              room_info.map((room) => {
                return getReservedRooms(room.num_room).then((reserv_room) => {
                  if (reserv_room.length === 0) {
                    available_room.push(room);
                  } else {
                    let available = true;
                    const reserv_checkin = moment(
                      reserv_room[0].checkin,
                      format
                    );
                    const reserv_checkout = moment(
                      reserv_room[0].checkout,
                      format
                    );
                    const reserv_daycount = reserv_checkout.diff(
                      reserv_checkin,
                      "days"
                    );

                    for (
                      let reserv_date_index = 0; reserv_date_index < reserv_daycount; reserv_date_index++
                    ) {
                      reserv_checkin2 = reserv_checkin
                        .clone()
                        .add(reserv_date_index, "day");
                      reserv_checkin2_str = reserv_checkin2.format(format);

                      for (
                        let checkin_index = 0; checkin_index < search_daycount; checkin_index++
                      ) {
                        checkin2 = checkin.clone().add(checkin_index, "day");

                        if (checkin2.isSame(reserv_checkin2)) {
                          available = false;
                          break;
                        } else if (!checkin2.isSame(reserv_checkin2)) {
                          available = true;
                        }
                      }
                    }
                    if (available) {
                      available_room.push(room);
                    }
                  }
                });
              })
            );
          });
        })
      )
        .then(() => {
          available_room = available_room.reduce((acc, obj) => {
            const found = acc.some((item) => item.id === obj.id);
            if (!found) {
              acc.push(obj);
            }
            return acc;
          }, []);
          // console.log(available_room);

          var booked = [];

          for (let i = 0; i < booking_room.length; i++) {
            for (let j = 0; j < available_room.length; j++) {
              if (available_room[j].id_typeroom == booking_room[i]) {
                booked.push(available_room[j]);
                available_room.splice(j, 1);
                break;
              }
            }
          }
          // console.log(booked);
          con.query(
            "select id from customer where f_name = '" +
            firstName +
            "' and l_name = '" +
            lastName +
            "' and card_num ='" +
            card_id +
            "' and  p_num = '" +
            p_number +
            "' and email = '" +
            email +
            "'",
            (err, id) => {
              if (err) throw err;
              for (var i = 0; i < booked.length; i++) {
                booked2 = booked[i];
                checkin2 = checkin.clone().format(format);
                checkout2 = checkout.clone().format(format);
                con.query(
                  "insert into reserved value ('',?,?,?,?,'0',?,?,?)", [
                  booked2.num_room,
                  booked2.id_typeroom,
                  checkin2,
                  checkout2,
                  id[0].id,
                  more_info,
                  selectedOptionId,
                ],
                  (err, result) => {
                    if (err) throw err;
                    var payment_detail =
                      "จองห้อง " +
                      booked2.num_room +
                      " จ่ายด้วยวิธี " +
                      selectedOptionId +
                      " วันที่ " +
                      moment().format(format) +
                      " เข้าพักวันที่ " +
                      checkin2 +
                      " ถึงวันที่ " +
                      checkout2;
                    con.query(
                      "insert into payment_log value ('',?,?)", [payment_detail, id[0].id],
                      (err, result) => {
                        if (err) throw err;
                        res.send({ success: "success" });
                      }
                    );
                  }
                );
              }
            }
          );
        })
        .catch((err) => {
          console.error(err);
        });
    }

    function send_email() {
      let booked_success = {
        from: "testinghotel9@gmail.com", // sender address
        to: email, // list of receivers
        subject: "Booking Confirmation", // Subject line
        text: "Dear Customer, Thank you for booking our hotel room. Your booking has been confirmed. We look forward to welcoming you to our hotel.", // plain text body
      };

      transporter.sendMail(booked_success, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    }
  });

  function countObjectsWithPropertyValue(arr, property, value, maxCount) {
    const count = arr.reduce((acc, obj) => {
      if (obj[property] === value && acc < maxCount) {
        acc++;
      }
      return acc;
    }, 0);
    return count;
  }
};