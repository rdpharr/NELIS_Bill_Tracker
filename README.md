# NELIS Bill Tracker

This is the repository for a web tool and data scraper to watch legislative bills in Nevada. *It's a work in progress.*

online at http://nvbilltracker.org

Data is sourced from [NELIS](https://www.leg.state.nv.us/App/NELIS/REL/81st2021) (Nevada Electronic Legislative Information System).

3 components:
 - Data scraper is in scrape.js (triggered by node/express)
 - SQL database is defined in bill_tracker_db.sql
 - Web app is built on node/express