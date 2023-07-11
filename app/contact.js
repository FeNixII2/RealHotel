module.exports = function (app, con) {
    app.post('/confirm_sendcontact', (req, res) => {
        var { fullname, phone, email, details } = req.body
        con.query("insert into contact_us values ('',?,?,?,?)", [fullname, email, phone, details], (err) => {
            if (err) throw err
            res.send({})
        })
    });
}