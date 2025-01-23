const mysql = require('mysql2');

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'soulconnnect'
});

// MySQL connection
// const db = mysql.createConnection({
//     host: 'db.22literverf.store',
//     port: '3306',
//     user: 'user',
//     password: 'daap',
//     database: 'db'
// });

// // MySQL connection
// // const db = mysql.createConnection({
// //     host: 'db.22literverf.store',
// //     port: '3306',
// //     user: 'user',
// //     password: 'daap',
// //     database: 'db'
// // });

// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err);
//         process.exit(1); // Exit the application if connection fails
//     } else {
//         console.log('Connected to the MySQL database');
//     }
// });

module.exports = db;