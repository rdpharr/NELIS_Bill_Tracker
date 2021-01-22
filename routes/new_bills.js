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
    con.query('select * from bills ORDER BY introduced DESC',(error, results) => {
        if (error) {
            console.log(d);
            console.log({ error: error });
        }
        res.render('new_bills', {
            title: 'Newest Bills',
            data: results
        });
    });
});

module.exports = router;