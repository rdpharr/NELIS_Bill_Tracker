create database bills;
use bills;
create table IF NOT EXISTS bills (
	bill varchar(10),
	bill_id INT NOT NULL UNIQUE,
    url varchar(500),
    summary varchar(500),
    introduced datetime,
    fiscal_notes varchar(500),
    primary_sponsor varchar(500),
    title TEXT,
    digest LONGTEXT,
    most_recent_action  varchar(500),
    upcoming_hearings varchar(500),
    past_hearings varchar(500),
    final_passage_votes varchar(500),
    conference_committees varchar(500),
    bill_text varchar(500),
    bill_history varchar(500),
    PRIMARY KEY (bill_id),
    INDEX (introduced)
);