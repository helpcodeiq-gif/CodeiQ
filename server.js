const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;

// 1. Root folder lo unna anni files ni public chey
app.use(express.static(path.join(__dirname)));

// 2. Home page ki index.html pampu
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. Vere edaina route kotte kuda index.html pampu - Not Found raadhu
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 4. Server start chey
app.listen(PORT, () => {
  console.log(`CodeIQ Server Running Successfully on Port ${PORT}`);
});
