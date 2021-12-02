const router = require('express').Router();

router.get('/', function (req, res) {
  res.render('home',{msg: "hello"});
});

module.exports = router;
