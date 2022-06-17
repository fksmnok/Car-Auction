"use strict"
const config = require('./config.js');
const express = require('express');
const app = express();
const http_socket = require('http').Server(app);
const io_socket = require('socket.io')(http_socket);
const bodyParser = require('body-parser');
const passport = require("passport");
const session = require('express-session');

var LocalStrategy = require("passport-local").Strategy;
var fileUpload = require('express-fileupload');
app.use(fileUpload());
require('date-utils');
var path = require('path');
const fs = require('fs');
const multer = require('multer');
var cronJob = require('cron').CronJob;
var username = "";
/*-------------------DB--------------------*/
const mysql = require('mysql');
const { exit } = require('process');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    database: 'kosacars'
});

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxage: 1000 * 60 * 30 // 30分でcookie消える
    }
}));

/*-------------------DB接続確認--------------------*/
connection.connect((error) => {
    if (error) {
        console.log('error connecting: ' + error.stack);
        return;
    }
    console.log('success');
});

app.set('view engine', 'ejs');

// パス指定モジュール
app.use(express.static(__dirname + "/views", { index: false }));
app.use(express.static(__dirname + "/public", { index: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());


//TOP
app.get('/', (req, res) => {
    if (req.session.username != undefined) {
        username = req.session.username;
        console.log(username);
    }
    connection.query(
        // 'SELECT * FROM car WHERE listing_flg = 1'
        'SELECT * FROM car',
        (error, results) => {
            if (error) {
                console.log('error connecting:' + error.stack);
                return;
            }
            connection.query(
                'SELECT * FROM listing',
                (error, results2) => {
                    if (error) {
                        console.log('error connecting:' + error.stack);
                        return;
                    }
                    connection.query(
                        // 'SELECT * FROM car WHERE listing_flg = 1'
                        'SELECT * FROM image',
                        (error, results3) => {
                            if (error) {
                                console.log('error connecting:' + error.stack);
                                return;
                            }

                            console.log(results3);

                            res.render('index.ejs', {
                                car: results,
                                syuppin: results2,
                                image: results3,
                                login: req.session.username
                            });
                        });
                });
        });
});

// 検索
app.get('/search', (req, res) => {
    let values = [
        'car',
        req.query.search
    ];
    connection.query(
        'SELECT * FROM ?? WHERE car_name LIKE "%"?"%"', values,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + error.stack);
                return;
            }
            console.log(results);
        }

        
    );
});

app.get('/sort', (req, res) => {
    let values = [
        'car',
        req.query.maker
    ];

    console.log(values);
    connection.query(
        'SELECT * FROM ?? WHERE maker LIKE "%"?"%"', values,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + error.stack);
                return;
            }

            connection.query(
                'SELECT * FROM listing',
                (error, results2) => {
                    if (error) {
                        console.log('error connecting:' + error.stack);
                        return;
                    }
                    connection.query(
                        // 'SELECT * FROM car WHERE listing_flg = 1'
                        'SELECT * FROM image',
                        (error, results3) => {
                            if (error) {
                                console.log('error connecting:' + error.stack);
                                return;
                            }

                            console.log(results3);

                            res.render('index.ejs', {
                                car: results,
                                syuppin: results2,
                                image: results3,
                                login: req.session.username
                            });
                        });
                });
        });
});


app.post('/', (req, res) => {
    if (req.body != undefined) {
        username = req.body.login_email_address;
        req.session.username = username;
    }
    console.log(req.session.username + "登録！！！");

    connection.query(
        'SELECT * FROM client',
        (error, user) => {
            if (error) {
                console.log('error connecting:' + error.stack);
                return;
            }
            connection.query(
                'SELECT * FROM client_pass',
                (error, user_pass) => {
                    if (error) {
                        console.log('error connecting:' + error.stack);
                        return;
                    }

                    for (var i = 0; i < user.length; i++) {
                        if (req.body.login_email_address === user[i].mail && req.body.login_password === user_pass[i].client_pass) {
                            req.session.regenerate((err) => {
                                req.session.username = user[i].mail;
                                res.redirect('/');
                            });
                            var loginFlag = true;
                            break;
                        } else {
                            var loginFlag = false;
                        }
                    }
                    if (loginFlag == false) {
                        res.redirect('login');
                    }
                });
        });
});


//日付から文字列に変換する関数
function getStringFromDate(date) {

    var year_str = date.getFullYear();
    //月だけ+1すること
    var month_str = 1 + date.getMonth();
    var day_str = date.getDate();
    var hour_str = date.getHours();
    var minute_str = date.getMinutes();
    var second_str = date.getSeconds();

    month_str = ('0' + month_str).slice(-2);
    day_str = ('0' + day_str).slice(-2);
    hour_str = ('0' + hour_str).slice(-2);
    minute_str = ('0' + minute_str).slice(-2);
    second_str = ('0' + second_str).slice(-2);

    var format_str = 'YYYY-MM-DD hh:mm:ss';
    format_str = format_str.replace(/YYYY/g, year_str);
    format_str = format_str.replace(/MM/g, month_str);
    format_str = format_str.replace(/DD/g, day_str);
    format_str = format_str.replace(/hh/g, hour_str);
    format_str = format_str.replace(/mm/g, minute_str);
    format_str = format_str.replace(/ss/g, second_str);

    return format_str;
}
//車詳細
app.get("/detail/:id", (req, res) => {
    if (req.session.username != undefined) {
        username = req.session.username;
        console.log(username);
    }

    let values = [
        'car',
        req.params.id
    ]

    connection.query(
        "SELECT * FROM ?? WHERE product_num=?", values,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + err.stack);
                return;
            }
            connection.query(
                'SELECT * FROM listing WHERE product_num = "' + req.params.id + '"',
                (error, results2) => {
                    if (error) {
                        console.log('error connecting:' + err.stack);
                        return;
                    }
                    connection.query(
                        'SELECT * FROM bid WHERE product_id = "' + req.params.id + '"',
                        (error, results3) => {
                            if (error) {
                                console.log('error connecting:' + error.stack);
                                return;
                            }

                            var date = results2[0].end_bid_day;
                            var rtn_str = getStringFromDate(date);
                            console.log(rtn_str);

                            // var month = rtn_str.substr(5,2);
                            var month1 = rtn_str.substr(5, 1);
                            var month2 = rtn_str.substr(6, 1);
                            if (month1 == '0') {
                                var month = month2;
                                month = Number(month);
                                month = month - 1;
                            } else {
                                var month = month1 + month2;
                                month = Number(month);
                                month = month - 1;
                            }
                            // var day = rtn_str.substr(8,2);
                            var day1 = rtn_str.substr(8, 1);
                            var day2 = rtn_str.substr(9, 1);
                            if (day1 == '0') {
                                var day = day2;
                            } else {
                                var day = day1 + day2;
                            }
                            // var hour = rtn_str.substr(11,2);
                            var hour1 = rtn_str.substr(11, 1);
                            var hour2 = rtn_str.substr(12, 1);
                            if (hour1 == '0') {
                                var hour = hour2;
                            } else {
                                var hour = hour1 + hour2;
                            }
                            // var minute = rtn_str.substr(14,2);
                            var minute1 = rtn_str.substr(14, 1);
                            var minute2 = rtn_str.substr(15, 1);
                            if (minute1 == '0') {
                                var minute = minute2;
                            } else {
                                var minute = minute1 + minute2;
                            }
                            var cronTime = '1 ' + minute + ' ' + hour + ' ' + day + ' ' + month + ' *';

                            // var cronTime =  '0 48 13 17 0 *';

                            // *の部分を半角数字にすることで決まった日時に実行されるジョブになる。
                            //  ******(起動したい処理)
                            //  ||||||
                            //  ||||||-曜日(0:日曜日-6:土曜日)
                            //  |||||--月
                            //  ||||---日
                            //  |||----時
                            //  ||-----分
                            //  |------秒
                            // 5つの場合は曜日~分になり、秒は指定しない
                            connection.query(
                                'SELECT * FROM client',
                                (error, client) => {
                                    if (error) {
                                        console.log('error connecting:' + error.stack);
                                        return;
                                    }
                                    connection.query(
                                        'SELECT * FROM image WHERE product_num = "' + req.params.id + '"',
                                        (error, results4) => {
                                            if (error) {
                                                console.log('error connecting:' + error.stack);
                                                return;
                                            }

                                            var job = new cronJob({

                                                cronTime: cronTime,
                                                context: {
                                                    // value1: results3[results3.length - 1].bid_amount,
                                                    // value2: buyer_mail,
                                                },
                                                onTick: function () { // 指定時に実行したい関数
                                                    // console.log(this.value1);
                                                    // console.log(this.value2);
                                                    job.stop();
                                                },
                                                onComplete: function () { // ジョブの完了または停止時に実行する関数
                                                    console.log('完了です');
                                                    connection.query(
                                                        'SELECT * FROM bid WHERE product_id = "' + req.params.id + '"',
                                                        (error, bid) => {
                                                            if (error) {
                                                                console.log('error connecting:' + error.stack);
                                                                return;
                                                            }
                                                            connection.query("UPDATE listing SET bid_end_flag = 1,successful_bid_amount = '" + bid[bid.length - 1].bid_amount + "',buyer_id = '" + bid[bid.length - 1].client_id + "' WHERE product_num = '" + req.params.id + "'");
                                                        });
                                                },
                                                start: true, // ジョブを開始するかどうか
                                                timeZone: 'Asia/Tokyo'
                                            });

                                            if (results3.length != 0) {
                                                res.render('carDetail.ejs', {
                                                    id: req.params.id,
                                                    results: results[0],
                                                    values: results2,
                                                    endDate: results2[0].end_bid_day,
                                                    nowprice: results3[results3.length - 1].bid_amount,
                                                    image: results4,
                                                    user: req.session.username,
                                                });
                                            } else {
                                                res.render('carDetail.ejs', {
                                                    id: req.params.id,
                                                    results: results[0],
                                                    values: results2,
                                                    endDate: results2[0].end_bid_day,
                                                    nowprice: results2[0].bid_amount,
                                                    image: results4,
                                                    user: req.session.username,
                                                });
                                            }
                                        }
                                    );
                                });
                        });
                });
        });
});

//完了画面
app.get("/comp/:id", (req, res) => {
    if (req.session.username != undefined) {
        username = req.session.username;
        console.log(username);
    }

    let values = [
        'car',
        req.params.id
    ]

    connection.query(
        "SELECT * FROM ?? WHERE product_num=?", values,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + err.stack);
                return;
            }
            connection.query(
                'SELECT * FROM bid WHERE product_id = "' + req.params.id + '"',
                (error, results2) => {
                    if (error) {
                        console.log('error connecting:' + error.stack);
                        return;
                    }
                    connection.query(
                        'SELECT * FROM client WHERE id = "' + results2[results2.length - 1].client_id + '"',
                        (error, client) => {
                            if (error) {
                                console.log('error connecting:' + error.stack);
                                return;
                            }
                            if (client[0].mail == username) {
                                var flag = true;
                            } else {
                                var flag = false;
                            }

                            console.log(results);
                            res.render('comp.ejs', {
                                id: req.params.id,
                                results: results[0],
                                username: username,
                                flag: flag
                            });
                        });
                });
        });
});

//login
app.get("/login", (req, res) => {
    res.render('userLogin.ejs');
});

app.get("/traderlogin", (req, res) => {
    res.render('traderLogin.ejs');
});

//社員登録
app.get("/traderentry", (req, res) => {
    res.render('traderEntry.ejs');
});

//書類
app.get("/document", (req, res) => {
    if (req.session.username != undefined) {
        username = req.session.username;
        console.log(username);
    }
    let values = [
        'client',
        req.session.username
    ]
    connection.query(
        "SELECT * FROM ?? WHERE mail=?", values,
        (error, client) => {
            if (error) {
                console.log('error connecting:' + err.stack);
                return;
            }

            let values2 = [
                'listing',
                client[0].id
            ]

            connection.query(
                "SELECT * FROM ?? WHERE buyer_id=?", values2,
                (error, results) => {
                    if (error) {
                        console.log('error connecting:' + err.stack);
                        return;
                    }
                    var sumBitAmount = 0;
                    for (var i = 0; i < results.length; i++) {
                        sumBitAmount = sumBitAmount + results[i].successful_bid_amount;
                    }
                    res.render('document.ejs', {
                        value: sumBitAmount
                    });
                });
        });
});

//在庫登録
app.get("/register", (req, res) => {
    res.render('stockRegister.ejs');
});


passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },

    function (email, password, done) {

        connection.query(
            'SELECT * FROM admin_pass',
            (error, results) => {
                if (error) {
                    console.log('error connecting:' + error.stack);
                    return;
                }
                console.log(results);

                var id = results[0]['id'];

                var userlist = {
                    1: results[0]['admin_pass'],
                    "yasui": "takato"
                };

                console.log(userlist)

                var ans = false;
                if (userlist[email] == password) {
                    ans = true;
                }

                console.log(ans);
                if (!ans) {
                    return done(null, false);
                } else {
                    return done(null, email);
                }

            });


    }
));


//業者TOP
app.get("/master", (req, res) => {

    connection.query(
        'SELECT * FROM admin_pass',
        (error, results) => {
            if (error) {
                console.log('error connecting:' + error.stack);
                return;
            }
            console.log(results[0]['id']);
            res.render('traderIndex.ejs');
        });
});

//業者TOP
app.post("/master",
    passport.authenticate('local',
        {
            session: false,
            // successRedirect: '/chat',
            failureRedirect: '/traderlogin'
        }
    ),

    function (req, res) {
        //"SELECT username FROM t01_users WHERE email ="+userlist[email],

        //console.log(req.user)
        res.render('traderIndex.ejs');
    }
);

//選択
app.get("/select", (req, res) => {
    res.render('select.ejs');
});

//社員登録
app.get("/traderentry", (req, res) => {
    res.render('traderEntry.ejs');
});

//出品詳細
app.get("/display/:id", (req, res) => {

    let values = [
        'car',
        req.params.id
    ]

    connection.query(
        "SELECT * FROM ?? WHERE id=?", values,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + err.stack);
                return;
            }
            console.log(results[0]);
            res.render('display.ejs', {
                values: results[0]
            });
        });
});

//出品完了
app.post("/displaycomp", function (req, res) {

    let values = [
        'car',
        1,
        req.body.id
    ]

    let values1 = [
        'listing',
        req.body.id,
        req.body.p_num,
        req.body.date,
        req.body.date_s,
        req.body.money,
        0,
        "001"
    ]

    console.log(values1);

    connection.query(
        "UPDATE ?? SET listing_flg=? WHERE id=?;", values,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + error.stack);
                return;
            }
            console.log(results);
        }
    );

    connection.query("INSERT INTO ??(id, product_num, start_bid_day, end_bid_day, bid_amount, bid_end_flag, seller_admin_id) VALUES (?,?,?,?,?,?,?);", values1,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + error.stack);
                return;
            }
            console.log(results);
        });

    console.log('PUT:' + 'success!!');
    var senddata = {
        name: "出品しました!!"
    }
    res.send(senddata);
});

//出品取消
app.post("/displaycom", function (req, res) {

    let values = [
        'car',
        0,
        req.body.name
    ]

    let values1 = [
        'listing',
        req.body.name,
    ]

    connection.query(
        "UPDATE ?? SET listing_flg=? WHERE id=?;", values,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + err.stack);
                return;
            }
            console.log(results);
        }
    );

    connection.query(
        "DELETE FROM ?? WHERE id=?;", values1,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + err.stack);
                return;
            }
            console.log(results);
        }
    );

    console.log('PUT:' + 'success!!');
    var senddata = {
        name: "出品を取り消しました!!"
    }
    res.send(senddata);
});

//在庫一覧
app.get("/stock", (req, res) => {

    connection.query(
        "SELECT * FROM car WHERE listing_flg = 0 OR listing_flg IS NULL",
        (error, results) => {
            if (error) {
                console.log('error connecting:' + err.stack);
                return;
            }
            // res.write(JSON.stringify(results));
            console.log(results);
            res.render('stock.ejs', {
                values: results
            });
            //res.end();
            //res.end();
        });
});

//出品詳細
app.get("/history", (req, res) => {

    connection.query(
        "SELECT * FROM listing",
        (error, results) => {
            if (error) {
                console.log('error connecting:' + err.stack);
                return;
            }
            // res.write(JSON.stringify(results));
            console.log(results);
            res.render('history.ejs', {
                values: results
            });
            //res.end();
        });
});

//ユーザー一覧
app.get("/userlist", (req, res) => {

    connection.query(
        "SELECT * FROM client",
        (error, results) => {
            if (error) {
                console.log('error connecting:' + err.stack);
                return;
            }
            // res.write(JSON.stringify(results));
            console.log(results);
            res.render('userList.ejs', {
                values: results
            });
            //res.end();
        });
});

//社員一覧
app.get("/traderlist", (req, res) => {

    connection.query(
        "SELECT * FROM admin",
        (error, results) => {
            if (error) {
                console.log('error connecting:' + err.stack);
                return;
            }
            // res.write(JSON.stringify(results));
            console.log(results);
            res.render('traderList.ejs', {
                values: results
            });
            //res.end();
        });
});



//在庫登録
app.post('/users', function (req, res) {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();


    let values = [
        'car',
        req.body.product_name,
        req.body.product_num,
        req.body.model_year,
        req.body.car_name,
        req.body.shape,
        req.body.grade,
        req.body.history,
        req.body.model,
        req.body.engine_size,
        req.body.fuel,
        req.body.year + req.body.month + req.body.day,
        req.body.mileage,
        req.body.outer_color,
        req.body.inner_color,
        req.body.com,
        req.body.eva,
        req.body.type,
        req.body.sales,
        req.body.door,
        req.body.d_type,
        req.body.d_sys,
        req.body.capa,
        req.body.g_weight,
        req.body.y_ear + req.body.m_onth + req.body.d_ay,
        req.body.sup,
        req.body.money,
        req.body.adminid,
        year + month + day,
        req.body.maker,
        req.body.flg,
    ];

    console.log(values);

    connection.query("INSERT INTO ??(product_name, product_num, model_year, car_name, shape, grade, history, model, engine_size, fuel, inspection_date, mileage, outer_color, inner_color, lister_comment, evaluation, car_type, sales_point, door, door_type, drive_system, capacity, gross_weight, purchase_date, supplir, purchase_amount, admin_id, admin_date,  maker, listing_flg) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);", values,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + error.stack);
                return;
            }
            console.log(results);
        }
    );
    console.log(values);
    console.log('POST:' + 'success!!');
    var senddata = {
        name: "車両登録完了",
    }
    res.render('file.ejs', senddata);
});

//fileupload
app.post('/upload', multer({ dest: '/' }).single('file'), (req, res) => {
    let sendValues = [
        'image',
        "copy_" + req.body.file,
        req.body.product_num,
        "top"
    ];
    connection.query('INSERT INTO ?? (path,product_num,place) VALUES (?,?,?)', sendValues);

    fs.copyFile('./public/files/' + req.body.file, "./public/img/copy_" + req.body.file, (err) => {
        if (err) throw err;

        console.log('ファイルをコピーしました');
    });
    res.render('traderIndex.ejs');
})


//社員登録
app.post('/traderuser', function (req, res) {


    let values = [
        'admin',
        req.body.adminid,
        req.body.lastname,
        req.body.firstname,
        req.body.hlast,
        req.body.hfirst,
        req.body.phone,
        req.body.mail,
        req.body.birthday,
        req.body.address,
        req.body.flg,
    ];

    connection.query("INSERT INTO ??(admin_id, last_name, first_name, h_last_name, h_first_name, call_number, mail, birthday, address, withdrawal_flag) VALUES (?,?,?,?,?,?,?,?,?,?);", values,
        (error, results) => {
            if (error) {
                console.log('error connecting:' + error.stack);
                return;
            }
            console.log(results);
        });

    console.log(values);
    console.log('POST:' + 'success!!');
    var senddata = {
        name: "社員登録完了"
    }
    res.render('traderIndex.ejs', senddata);
    //res.send(senddata);
});

//社員登録
// app.post('/traderuser', function (req, res) {


//     let values = [
//         'admin',
//         req.body.adminid,
//         req.body.lastname,
//         req.body.firstname,
//         req.body.hlast,
//         req.body.hfirst,
//         req.body.phone,
//         req.body.mail,
//         req.body.birthday,
//         req.body.address,
//         req.body.flg,
//     ];

//     connection.query("INSERT INTO ??(admin_id, last_name, first_name, h_last_name, h_first_name, call_number, mail, birthday, address, withdrawal_flag) VALUES (?,?,?,?,?,?,?,?,?,?);", values,
//         (error, results) => {
//             if (error) {
//                 console.log('error connecting:' + error.stack);
//                 return;
//             }
//             console.log(results);
//             res.render('chat.ejs', {
//                 id: results[0].id,
//                 data: results[0].username
//             });
//         }
//     );
// });

/*-------------------port--------------------*/
http_socket.listen(config.port);

// クライアントからの提案
io_socket.on('connection', function (socket) {
    console.log('connected');
    // クライアント(ブラウザ)->サーバ(Node.js)へSocket受信
    socket.on('c2s-join', function (msg) {
        socket.join(msg.chat);
    });

    socket.on('c2s-chat', function (msg) {
        connection.query(
            'SELECT bid_amount FROM bid WHERE product_id = "' + msg.chat + '"',
            (error, results) => {
                if (error) {
                    console.log('error connecting:' + error.stack);
                    return;
                }
                connection.query(
                    'SELECT * FROM listing WHERE product_num = "' + msg.chat + '"',
                    (error, results1) => {
                        if (error) {
                            console.log('error connecting:' + error.stack);
                            return;
                        }

                        var nowDate = new Date();
                        nowDate = nowDate.getFullYear() +
                            (nowDate.getMonth() + 1) +
                            nowDate.getDate() +
                            nowDate.getHours() +
                            nowDate.getMinutes()
                        nowDate = Number(nowDate);

                        connection.query(
                            'SELECT * FROM client WHERE mail = "' + msg.username + '"',
                            (error, user) => {
                                if (error) {
                                    console.log('error connecting:' + error.stack);
                                    return;
                                }
                                if (results.length != 0) {
                                    console.log(results[results.length - 1].bid_amount);
                                    console.log(user[0].mail);
                                    var price = results[results.length - 1].bid_amount + msg.value;
                                } else {
                                    var price = results1[0].bid_amount + msg.value;
                                }

                                connection.query('INSERT INTO bid(client_id, product_id, bid_date, bid_amount) VALUES(' + user[0].id + ' , ' + msg.chat + ',' + nowDate + ',' + price + ')');
                                io_socket.to(msg.chat).emit('s2c-chat', price);
                            }
                        );
                    });
            });
    });
});