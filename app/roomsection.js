module.exports = function (app, con) {
  app.post("/loaddata", (req, res) => {
    con.query("select * from datarooms", (err, data) => {
      res.send({ data });
    });
  });
};
