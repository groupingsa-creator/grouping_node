const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    req.auth = { userId };

    User.findOne({_id: userId}).select('locked').lean().then(
      (user) => {
        if (user && !user.locked) {
          next();
        } else {
          res.status(201).json({ status: 5, message: "Déconnectez-le" });
        }
      },
      (err) => {
        res.status(402).json({ err });
      }
    );
  } catch (error) {
    res.status(401).json({ error });
  }
};
