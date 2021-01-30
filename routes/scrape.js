const express = require('express');
const router = express.Router();

const axios = require('axios');
const { ConcurrencyManager } = require("axios-concurrency");
const cheerio = require('cheerio');
const mysql = require('mysql2');
const moment = require('moment');
require('dotenv').config();

router.get('/', function (req, res, next) {
    scrape_bills(req,res,next);
});

function scrape_bills(req,res,next){
    console.log('starting scraper...')
    // concurrency setup
    let api = axios.create({baseURL: "https://www.leg.state.nv.us/App/NELIS/REL/81st2021/Bill"});
    const MAX_CONCURRENT_REQUESTS = 10;
    const manager = ConcurrencyManager(api, MAX_CONCURRENT_REQUESTS);

    //start parsing
    const url = 'https://www.leg.state.nv.us/App/NELIS/REL/81st2021/HomeBill/BillsTab?Filters.SearchText=&Filters.DisplayTitles=false&Filters.PageSize=2147483647';
    axios.get(url)
        .then((response) => {
            let bills = parse_link_page(response);
            let bill_nos = bills.map(({bill_id})=>bill_id);
            Promise.all(bill_nos.map(id => api.get(`/FillSelectedBillTab?selectedTab=Overview&billKey=${id}`)))
                .then(responses => {
                    let data = parse_bill_pages(responses, bills);
                    db_push(data);
                    console.log("updated "+data.length+" bills in database...");
                    res.send('Done!');
                });
            manager.detach()
        })
        .catch((error) => {
            console.error(error.errorText)
        });
}

function db_push(data){
    let config ={
        host: process.env.MYSQL_SERVER,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: "bills"
        //waitForConnections: true,
        //connectionLimit: 10,
        //queueLimit: 0
    }
    let con = mysql.createConnection(config);

    let sql='INSERT INTO bills (bill_id, bill, url, summary, introduced, fiscal_notes, primary_sponsor, title, ';
    sql += 'digest, most_recent_action, upcoming_hearings, past_hearings, final_passage_votes, conference_committees,';
    sql += 'bill_text, bill_history) ';
    sql += 'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ';
    sql += 'ON DUPLICATE KEY UPDATE ';
    sql += 'bill_id=VALUES(bill_id), bill=VALUES(bill), url=VALUES(url), summary=VALUES(summary), introduced=VALUES(introduced), ';
    sql += 'fiscal_notes=VALUES(fiscal_notes), primary_sponsor=VALUES(primary_sponsor), title=VALUES(title), digest=VALUES(digest),';
    sql += 'most_recent_action=VALUES(most_recent_action), upcoming_hearings=VALUES(upcoming_hearings), past_hearings=VALUES(past_hearings),';
    sql += 'final_passage_votes=VALUES(final_passage_votes), conference_committees=VALUES(conference_committees), ';
    sql += 'bill_text=VALUES(bill_text), bill_history=VALUES(bill_history)';

    for (let i=0; i<data.length; i++){
        let d = data[i];
        let bill = [
            parseInt(d['bill_id']),
            d['bill'],
            d['url'],
            d['summary'],
            moment(d['introduced'], "dddd, MMMM DD YYYY").toDate(),
            d['fiscal_notes'],
            d['primary_sponsor'],
            d['title'],
            d['digest'],
            d['most_recent_action'],
            d['upcoming_hearings'],
            d['past_hearings'],
            d['final_passage_votes'],
            d['conference_committees'],
            d['bill_text'],
            d['bill_history']
        ];
        con.query(sql,bill,(error, results) => {
            if (error) {
                console.log(d);
                console.log({ error: error });
            }
            //console.log(results);
        });
    }
}

function parse_link_page(response){
    const $ = cheerio.load(response.data);
    var links = [];
    $('#billList').find('a').each(function (index, element) {
        links.push({
            'bill': $(element).contents().text(),
            'bill_id': $(element).attr('href').split('/')[6],
            'href': $(element).attr('href')
        });
    });
    return links;
}

function parse_bill_pages(responses, bills){
    let data = [];
    for (let i=0; i<responses.length; i++){
        let $ = cheerio.load(responses[i].data);

        let d = {
            'bill': bills[i]['bill'],
            'bill_id': bills[i]['bill_id'],
            'url': bills[i]['href'],
            'summary': $('div:contains("Summary")').next('div.col').text().replace(/\s+/g, ' ').trim(),
            'introduced':$('div:contains("Introduction Date")').next('div.col').text().replace(/\s+/g, ' ').trim(),
            'fiscal_notes':$('div:contains("Fiscal Notes")').next('div.col').text().replace(/\s+/g, ' ').trim(),
            'primary_sponsor':$('div:contains("Primary Sponsor")').next('div.col').text().replace(/\s+/g, ' ').trim(),
            'title':$('div:contains("Title")').next('div.col').text().replace(/\s+/g, ' ').trim(),
            'digest':$('div:contains("Digest")').next('div.col').text().replace(/\s+/g, ' ').trim(),
            'most_recent_action':$('div.col:contains("Most Recent History Action")').next('div').next('div').text().replace(/\s+/g, ' ').trim(),
            'upcoming_hearings':$('div:contains("Upcoming Hearings")').next('div').next('div').text().replace(/\s+/g, ' ').trim(),
            'past_hearings':$('div:contains("Past Hearings")').next('div').next('div').text().replace(/\s+/g, ' ').trim(),
            'final_passage_votes':$('div:contains("Final Passage Votes")').next('div').next('div').text().replace(/\s+/g, ' ').trim(),
            'conference_committees':$('div:contains("Conference Committees")').next('div').next('div').text().replace(/\s+/g, ' ').trim(),
            'bill_text':$('div:contains("Bill Text")').next('div').next('div').text().replace(/\s+/g, ' ').trim(),
            'bill_history':$('div:contains("Bill History")').parent().next('div.row').text().replace(/\s+/g, ' ').trim()
        };
        d['digest'] = d['digest'].split('Close digest')[0];
        d['title'] = d['title'].split('Close title')[0];
        d['primary_sponsor'] = d['primary_sponsor'].replace('View 1 Primary Sponsors Close Primary Sponsors','');
        data.push(d);
    }
    return data;
}

module.exports = router;