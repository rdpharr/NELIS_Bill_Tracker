const express = require('express');
const router = express.Router();

const mysql = require('mysql2');
require('dotenv').config();
const lunr = require('lunr');

router.post('/', function (req, res, next) {
    let config = {
        host: process.env.MYSQL_SERVER,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: "bills"
    }
    let con = mysql.createConnection(config);
    con.query('select * from bills ORDER BY introduced DESC', (error, documents) => {
        if (error) {
            console.log({error: error});
        }

        var idx = lunr(function () {
            this.ref('bill');
            this.field('summary');
            this.field('title');
            this.field('digest');

            documents.forEach(function (doc) {
                this.add(doc);
            }, this)
        });

        var term = req.body['SearchValue'];
        var search_results = idx.search(term).filter(x=>x.score>1);
        console.log(search_results);
        var bill_nos = search_results.map(x => x.ref);

        var bills = [];
        for (i=0; i<bill_nos.length; i++){
            bills.push(documents.find(x=>bill_nos[i]===x.bill))
        }
        let tracked_bills = Object.keys(req.cookies).filter(x=>x.substring(1,2) ==='B');
        for (let i=0;i<bills.length; i++){
            bills[i]['tracked'] = !!tracked_bills.includes(bills[i].bill);
        }
        res.render('bills', {
            title: `Search Results - "${term}"`,
            data: bills
        });
    });
});

module.exports = router;