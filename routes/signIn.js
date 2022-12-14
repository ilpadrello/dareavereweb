const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const sqlite = require("../modules/sqlitePromisify");
const jwtHandler = require("jsonwebtoken");
const jwtKey = require("../modules/jwtKeyGen");

router.post("/", async (req, res) => {
  // console.log(req.body);
  // console.log("Headers", req.headers);
  // console.log("Cookies: ", req.cookies);
  // console.log("Browser: " + req.headers["user-agent"]);
  // console.log("Language: " + req.headers["accept-language"]);

  let ip = req.socket.remoteAddress;
  let email = req.body.email;
  let plainPwd = req.body.password;
  if (email && plainPwd) {
    let pwd = crypto.createHash("sha512").update(plainPwd).digest("hex");
    let users = await sqlite.get(
      "SELECT * FROM users WHERE email = ? AND pwd = ?",
      [email, pwd]
    );

    if (users.length === 0) {
      console.log("USER NOT FOUND RETURN 401");
      res.status(401);
      res.send();
      return;
    } else {
      let currentDate = new Date();
      let user = {
        email: users[0].email,
        id: users[0].id,
        nickname: users[0].nickname,
        ip: ip,
        ttl: new Date(currentDate.getTime() + 15 * 60000),
        userAgent: req.headers["user-agent"],
      };
      let toReturn = jwtHandler.sign(user, jwtKey);
      res.cookie("Authorization", toReturn);
      res.send(toReturn);
      return;
    }
  } else {
    res.status(400);
    res.send("INVALID REQUEST");
    return;
  }
});

module.exports = router;
