drop database if exists verify;
create database verify;
 use verify;
 drop table if exists users;
 create table users
 (
 id varchar(20) primary key not null,
 username varchar(30) not null,
 passHash varchar(18) not null,
 created date default current_timestamp() on update current_timestamp()
 );
