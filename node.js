const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

// 建立 Express 應用程式
const app = express();
app.use(bodyParser.json());

// 設定 MySQL 連接
const db = mysql.createConnection({
  host: '140.136.151.129',
  user: 'LeeRain',
  password: 'Lee1979', // 你的 MySQL 密碼
  database: 'login'  // 你的資料庫名稱
});
/*
host: '140.136.151.129',
  user: 'shrimp',
  password: 'nm9487', // 你的 MySQL 密碼
  database: 'login'  // 你的資料庫名稱
*/

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
      console.error(err);
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
      charac = 0;
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
//儲存地區
app.post('/region', async (req, res) => {
  console.log("hk4g4")
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
//儲存角色編號
app.post('/charac', async (req, res) => {
  const { username, charac} = req.body;

  db.query('UPDATE users SET charac = ? WHERE username = ?', [charac, username], (err, result) => {
    if (err) {
      return res.status(500).send('更新失敗');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('使用者不存在');
    }
    res.status(200).send('角色更新成功');
  });
});
//儲存選擇裝飾編號
app.post('/decoration', async (req, res) => {
  const { username, decorate} = req.body;

  db.query('UPDATE users SET decorate = ? WHERE username = ?', [decorate, username], (err, result) => {
    if (err) {
      return res.status(500).send('更新失敗');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('使用者不存在');
    }
    res.status(200).send('裝飾更新成功');
  });
});
//取得角色編號
app.get('/charac', async (req, res) => {
  const username = req.query.username.trim().toLowerCase();

  const charac = 'SELECT charac FROM users WHERE username = ?';
  db.query(charac, [username], (err, results) => {
    if (err) {
      res.status(500).send('資料庫查詢失敗');
      console.log('error')
    } else {
      res.json(results[0].charac);
      //console.log(results[0].charac);
    }
  });
});
//取得擁有裝飾物
app.get('/package', (req, res) => {
  const username = req.query.username.trim().toLowerCase();
  const sql = 'SELECT decorate1,decorate2,decorate3,decorate4,decorate5,decorate6,decorate7,decorate8,decorate9,decorate10 FROM package WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      res.status(500).send('資料庫查詢失敗');
      console.log('error')
    } else {
      // 取得第一筆資料（如果有）
      const data = results[0];
        
      // 將資料庫中的數字欄位存儲到陣列 arr
      const arr = [
        data.decorate1,
        data.decorate2,
        data.decorate3,
        data.decorate4,
        data.decorate5,
        data.decorate6,
        data.decorate7,
        data.decorate8,
        data.decorate9,
        data.decorate10
      ];
      res.json(arr);
      //console.log(arr);
    }
  });
});

app.post('/charac', async (req, res) => {
  const { username, charac} = req.body;

  db.query('UPDATE users SET charac = ? WHERE username = ?', [charac, username], (err, result) => {
    if (err) {
      return res.status(500).send('更新失敗');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('使用者不存在');
    }
    res.status(200).send('角色更新成功');
  });
});

app.post('/shop_dec', async (req, res) => {
  const { username, decorations } = req.body;

  // 檢查請求資料是否有效
  if (!username || !decorations || !Array.isArray(decorations) || decorations.length !== 10) {
    return res.status(400).send('請求參數錯誤');
  }

  // 構建 SQL 語句
  const sql = `
    UPDATE package 
    SET 
      decorate1 = ?, decorate2 = ?, decorate3 = ?, decorate4 = ?, decorate5 = ?, 
      decorate6 = ?, decorate7 = ?, decorate8 = ?, decorate9 = ?, decorate10 = ?
    WHERE username = ?`;

  // 將裝飾品數值作為參數，並加上用戶名
  const params = [...decorations, username];

  // 更新資料庫
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('更新失敗：', err);
      return res.status(500).send('資料庫更新失敗');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('使用者不存在');
    }

    res.status(200).send('裝飾品更新成功');
  });
});//從商店將裝飾品數值推入到資料庫

app.get('/package', (req, res) => {
  const username = req.query.username.trim().toLowerCase();
  const sql = 'SELECT decorate1,decorate2,decorate3,decorate4,decorate5,decorate6,decorate7,decorate8,decorate9,decorate10 FROM package WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      res.status(500).send('資料庫查詢失敗');
      console.log('error')
    } else {
      // 取得第一筆資料（如果有）
      const data = results[0];
        
      // 將資料庫中的數字欄位存儲到陣列 arr
      const arr = [
        data.decorate1,
        data.decorate2,
        data.decorate3,
        data.decorate4,
        data.decorate5,
        data.decorate6,
        data.decorate7,
        data.decorate8,
        data.decorate9,
        data.decorate10
      ];
      res.json(arr);
    }
  });
});

app.get('/food', (req, res) => {
  const username = req.query.username.trim().toLowerCase();
  const sql = 'SELECT food1, food2, food3, food4, food5, food6, food7, food8, food9, food10 FROM food WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      res.status(500).send('資料庫查詢失敗');
      console.log('error')
    } else {
      // 取得第一筆資料（如果有）
      const data = results[0];
        
      // 將資料庫中的數字欄位存儲到陣列 arr
      const arr = [
        data.food1,
        data.food2,
        data.food3,
        data.food4,
        data.food5,
        data.food6,
        data.food7,
        data.food8,
        data.food9,
        data.food10
      ];
      res.json(arr);
    }
  });
});

// 啟動伺服器
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
