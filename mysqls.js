module.exports = {
    init: function () {
        return start();
    }
}
var mysql = require('mysql');
var con = null;

const schema ={
    list:["games","objects"],
    games:{
        sql:"CREATE TABLE games (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))"
    },
    objects:{
        sql:"CREATE TABLE objects (uuid INT PRIMARY KEY, name VARCHAR(255))"
    }
}

function start() {
    try {
        con = mysql.createConnection({
            host: "localhost",
            user: "jacob",
            password: "YGeuwf3hoQefuebo",
            database: "test"
        });
        //console.log(con)
        con.query("SELECT table_name FROM information_schema.tables WHERE table_schema ='test';", (err, result) => {
            if (err) {
                if(err.sqlMessage=="Unknown database 'test'") {
                    //console.log(err.code)
                    create();
                }
            }else{
                console.log(result)
            }
        });
    } catch (err) { console.log(err) }
}

function create(){
    //con.end();
    con.destroy();
    con = mysql.createConnection({
        host: "localhost",
        user: "jacob",
        password: "YGeuwf3hoQefuebo"
    });
    setTimeout(()=>{
        con.query("CREATE DATABASE test", function (err, result) {
            if (err) console.log(err);
            console.log("Database created");
            //console.log(result)
            con.destroy();
            setTimeout(start,500)
        });
    },500)
}


function no() {



    /*MySQL80
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });
    var sql = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES"

    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");

        /*  
    
    
        var sql = "CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Table created");
    
        });
        
        con.query("SELECT table_name FROM information_schema.tables WHERE table_schema ='test';", (err, result) => {
            if (err) { console.log(err) }
            console.log(result)
        });
        con.query("DROP DATABASE test;", (err, result) => {
            if (err) { console.log(err) }
            console.log(result)
        });
    });
    */
}