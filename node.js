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
/*
柏魚的(虛擬機)的:
host: 'localhost',
  user: 'root',
  password: 'dbms41126', // 你的 MySQL 密碼
  database: 'login'  // 你的資料庫名稱
冠尼的:
host: '140.136.151.129',
  user: 'LeeRain',
  password: 'Lee1979', // 你的 MySQL 密碼
  database: 'login'  // 你的資料庫名稱
蝦子的:
host: '140.136.151.129',
  user: 'shrimp',
  password: 'nm9487', // 你的 MySQL 密碼
  database: 'login'  // 你的資料庫名稱
兔子的:
host: '140.136.151.129',
  user: 'cha',
  password: 'jt930825', // 你的 MySQL 密碼
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
  const { username, password } = req.body;

  try {
    // 確認使用者是否已經註冊
    const [result] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);

    if (result.length > 0) {
      return res.status(400).send('使用者已存在');
    }

    // 加密密碼
    const hash = await bcrypt.hash(password, 10);

    // 設定預設值
    const region = ' ';
    const charac = 0;

    // 使用 transaction 來保證資料的一致性
    await db.promise().query('START TRANSACTION');

    try {
      // 將新使用者存入資料庫
      await db.promise().query('INSERT INTO users (username, password, region, charac) VALUES (?, ?, ?, ?)', [username, hash, region, charac]);

      // 初始化 decorate 資料
      await db.promise().query('INSERT INTO package (username, decorate1, decorate2, decorate3, decorate4, decorate5, decorate6, decorate7, decorate8, decorate9, decorate10) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)', [username]);
      await db.promise().query('INSERT INTO food (username, food1, food2, food3, food4, food5, food6, food7, food8, food9, food10) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)', [username]);
      await db.promise().query('INSERT INTO money (username, timer, timer2, timer3, timer4) VALUES (?, 0, 0, 0, 0)', [username])
      // 提交事務
      await db.promise().query('COMMIT');
      
      return res.status(201).send('註冊成功');
    } catch (err) {
      // 如果有錯誤，回滾事務
      await db.promise().query('ROLLBACK');
      console.error(err);
      return res.status(500).send('註冊失敗');
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('伺服器錯誤');
  }
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
//儲存地區(縣市、區域)
app.post('/region', async (req, res) => {
  //console.log("hk4g4")
  const { username, country, region} = req.body;
  console.log(username, country, region)
  db.query('UPDATE users SET country = ?, region = ? WHERE username = ?', [country, region, username], (err, result) => {
    if (err) {
      return res.status(500).send('更新失敗');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('使用者不存在');
    }
    res.status(200).send('區域更新成功');
    console.log("區域更新成功")
  });
});
//取得地區、天氣
app.get('/region', async (req, res) => {
  const username = req.query.username.trim().toLowerCase();
  console.log("test")
  try {
    // 等待第一個查詢完成
    const sql1 = 'SELECT country, region FROM users WHERE username = ?';
    const [results1] = await db.promise().query(sql1, [username]);

    if (results1.length === 0) {
      return res.status(404).send('用戶未找到');
    }

    const data = results1[0];

    // 等待第二個查詢完成
    const sql2 = 'SELECT Weather FROM weather WHERE CountyName = ? and TownName = ? and ObservationTime = (SELECT MAX(ObservationTime) FROM weather)';

    const [results2] = await db.promise().query(sql2, [data.country, data.region]);

    if (results2.length === 0) {
      console.log('天氣資料未找到')
      return res.status(404).send('天氣資料未找到');
    }
    
    const data2 = results2[0];
    console.log(data2.Weather)
    const keywords = {
      "晴": "weather1",
      "雨": "weather5",
      "陰": "weather2",
      "霧": "weather3",
      "霾": "weather4",      
  };
  
  // 模擬從資料庫獲取的天氣文本
  const text = data2.Weather;

  // 初始化匹配結果
  let matchedWeather = "未知天氣"; // 預設值為 "未知天氣"

  // 遍歷關鍵字進行匹配
  for (const [keyword, output] of Object.entries(keywords)) {
      const regex = new RegExp(keyword, 'g'); // 'g' 表示全局匹配
      if (regex.test(text)) {
          matchedWeather = output;
          break; // 匹配到後退出循環
      }
  }
  console.log(matchedWeather)
  // 組合結果
  const arr = [
      data.country,
      data.region,
      matchedWeather // 匹配結果放這
  ];

    // 回傳 JSON 數據
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.json(arr);
    console.log(arr);

  } catch (err) {
    // 錯誤處理
    res.status(500).send('資料庫查詢失敗');
    console.log('error', err);
  }
});
//選完地區後馬上取得天氣
app.get('/weather', async (req, res) => {
  const country = req.query.country.trim().toLowerCase();
  const region = req.query.region.trim().toLowerCase();
  console.log("test")
  try {
    // 等待第二個查詢完成
    const sql2 = 'SELECT Weather FROM weather WHERE CountyName = ? and TownName = ? and ObservationTime = (SELECT MAX(ObservationTime) FROM weather)';
    const [results2] = await db.promise().query(sql2, [country, region]);

    if (results2.length === 0) {
      console.log('天氣資料未找到')
      return res.status(404).send('天氣資料未找到');
    }
    
    const data2 = results2[0];
    console.log(data2.Weather)
    const keywords = {
      "晴": "weather1",
      "雨": "weather5",
      "陰": "weather2",
      "霧": "weather3",
      "霾": "weather4"
  };
  
  // 模擬從資料庫獲取的天氣文本
  const text = data2.Weather;

  // 初始化匹配結果
  let matchedWeather = "未知天氣"; // 預設值為 "未知天氣"

  // 遍歷關鍵字進行匹配
  for (const [keyword, output] of Object.entries(keywords)) {
      const regex = new RegExp(keyword, 'g'); // 'g' 表示全局匹配
      if (regex.test(text)) {
          matchedWeather = output;
          break; // 匹配到後退出循環
      }
  }
  // 組合結果

    // 回傳 JSON 數據
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.json(matchedWeather);
    console.log(matchedWeather);

  } catch (err) {
    // 錯誤處理
    res.status(500).send('資料庫查詢失敗');
    console.log('error', err);
  }
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
  const { username, decoration } = req.body;
  console.log(req.body);

  // 檢查請求內容是否正確
  if (!username || decoration === undefined) {
    return res.status(400).send('缺少必要參數');
  }

  // SQL 更新操作
  db.query('UPDATE users SET decorate = ? WHERE username = ?', [decoration, username], (err, result) => {
    if (err) {
      console.error('資料庫錯誤:', err); // 輸出詳細錯誤
      return res.status(500).send('更新失敗');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('使用者不存在');
    }
    res.status(200).send('裝飾更新成功');
  });
});

//取得角色編號,裝飾編號,金幣,好感度
app.get('/basicData', async (req, res) => {
  const username = req.query.username.trim().toLowerCase();

  const sql = 'SELECT charac, decorate, money, affection FROM users WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      res.status(500).send('資料庫查詢失敗');
      console.log('error')
    } else {
      const data = results[0];
      const arr = [
        data.charac,
        data.decorate,
        data.money,
        data.affection
      ]
      res.json(arr);
      console.log(arr);
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
    console.log('請求參數錯誤');
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
  console.log(params)

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

app.post('/shop_food', async (req, res) => {
  const { username, foods } = req.body;
  // 檢查請求資料是否有效
  if (!username || !foods || !Array.isArray(foods) || foods.length !== 10) {
    console.log(foods);
    if(!username){
      console.log('1');
    }
    if(!foods){
      console.log('2');
    }
    if(!Array.isArray(foods)){
      console.log('3');
    }
    if(foods.length !== 10){
      console.log('4');
    }
    
    console.log('請求參數錯誤');
    return res.status(400).send('請求參數錯誤');
  }
  // 構建 SQL 語句
  const sql = `
    UPDATE food 
    SET 
      food1 = ?, food2 = ?, food3 = ?, food4 = ?, food5 = ?, 
      food6 = ?, food7 = ?, food8 = ?, food9 = ?, food10 = ?
    WHERE username = ?`;

  // 將裝飾品數值作為參數，並加上用戶名
  const params = [...foods, username];
  console.log('更新參數：', params);

  // 更新資料庫
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('更新失敗：', err);
      return res.status(500).send('資料庫更新失敗');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('使用者不存在');
    }

    res.status(200).send('食物更新成功');
  });
});//從商店將食物數值推入到資料庫

//每日任務加錢
app.post('/dailymission', async (req, res) => {
  const { username, timer, timer2,timer3,timer4} = req.body;
  console.log(req.body)
  db.query('UPDATE money SET timer = ?, timer2 = ?, timer3 = ?, timer4 = ? WHERE username = ?', [timer, timer2, timer3, timer4,username], (err, result) => {
    if (err) {
      return res.status(500).send('更新失敗');
    }
    else{
      return res.status(200).send('完成任務');
    }
  });
});

app.get('/dailymission', (req, res) => {
  const username = req.query.username.trim().toLowerCase();
  const sql = 'SELECT timer,timer2,timer3,timer4 FROM Money WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      res.status(500).send('資料庫查詢失敗');
      console.log('error')
    } else {
      // 取得第一筆資料（如果有）
      const data = results[0];
      // 將資料庫中的數字欄位存儲到陣列 arr
      const arr = [
        data.timer,
        data.timer2,
        data.timer3,
        data.timer4
      ];
      res.json(arr);
      //console.log(arr)
    }
  });
});

app.post('/money', async (req, res) => {
  const { username, money} = req.body;

  db.query('UPDATE users SET money = ? WHERE username = ?', [money, username], (err, result) => {
    if (err) {
      return res.status(500).send('更新失敗');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('使用者不存在');
    }
    res.status(200).send('金錢更新成功');
  });
});//從金錢數值推入到資料庫

app.post('/affection', async (req, res) => {
  const { username, affection} = req.body;

  db.query('UPDATE users SET affection = ? WHERE username = ?', [affection, username], (err, result) => {
    if (err) {
      return res.status(500).send('更新失敗');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('使用者不存在');
    }
    res.status(200).send('好感度更新成功');
  });
});//從金錢數值推入到資料庫

// 啟動伺服器
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
