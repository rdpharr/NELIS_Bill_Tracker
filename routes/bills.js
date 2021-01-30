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
            console.log({ error: error });
        }
        let tracked_bills = Object.keys(req.cookies).filter(x=>x.substring(1,2) ==='B');
        for (let i=0;i<results.length; i++){
            results[i]['tracked'] = !!tracked_bills.includes(results[i].bill);
        }
        res.render('bills', {
            title: 'All Bills',
            data: results
        });
    });
});

module.exports = router;