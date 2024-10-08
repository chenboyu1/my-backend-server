const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

// 建立 Express 應用程式
const app = express();
app.use(bodyParser.json());

// 設定 MySQL 連接
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'dbms41126', // 你的 MySQL 密碼
  database: 'login'  // 你的資料庫名稱
});

// 連接 MySQL
db.connect((err) => {
  if (err) {
    console.error('無法連接 MySQL:', err);
    return;
  }
  console.log('已連接到 MySQL');
});

// 註冊路由
app.post('/register', async (req, res) => {
  const { username, password} = req.body;

  // 確認使用者是否已經註冊
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
    if (err) {
      return res.status(500).send('伺服器錯誤');
    }
    if (result.length > 0) {
      return res.status(400).send('使用者已存在');
    }

    // 加密密碼
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).send('密碼加密失敗');
      }
      region = ' ';
      charac = ' ';
      // 將新使用者存入資料庫
      db.query('INSERT INTO users (username, password, region, charac) VALUES (?, ?, ?, ?)', [username, hash, region, charac], (err, result) => {
        if (err) {
          return res.status(500).send('註冊失敗');
        }
        res.status(201).send('註冊成功');
      });
    });
  });
});

// 登入路由
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 查找使用者
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
    if (err) {
      return res.status(500).send('伺服器錯誤');
    }
    if (result.length === 0) {
      return res.status(400).send('使用者不存在');
    }

    const user = result[0];

    // 比對密碼
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).send('密碼比對失敗');
      }
      if (!isMatch) {
        return res.status(400).send('密碼錯誤');
      }
      res.status(200).send('登入成功');
    });
  });
});

app.post('/region', async (req, res) => {
  const { username, region} = req.body;

  db.query('UPDATE users SET region = ? WHERE username = ?', [region, username], (err, result) => {
    if (err) {
      return res.status(500).send('更新失敗');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('使用者不存在');
    }
    res.status(200).send('區域更新成功');
  });
});

// 啟動伺服器
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
