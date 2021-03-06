const express = require('express');
const router = express.Router();

const mysql = require('mysql2');
require('dotenv').config();

router.get('/', function (req, res, next) {
  let config ={
    host: process.env.MYSQL_SERVER,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: "bills"
  }
  let con = mysql.createConnection(config);
  con.query('select * from bills',(error, results) => {
    if (error) {
      console.log({ error: error });
    }
    let tracked_bills = Object.keys(req.cookies).filter(x=>x.substring(0,1) !='_');
    for (let i=0;i<results.length; i++){
      results[i]['tracked'] = !!tracked_bills.includes(results[i].bill);
    }

    var d = new Date();
    d.setDate( d.getDate() - 3 );
    res.render('index', {
      title: 'NV Bill Tracker',
      my_bills: results.filter(x=>x['tracked']===true),
      new_bills: results.filter(x=>x['introduced']>d),
    });
  });
});

module.exports = router;