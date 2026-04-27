const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('pages/base_layout', { title: 'Home', body_path: '../pages/index.ejs' });
});

app.listen(port, () => {
  console.log(`Frontend server listening on port: ${port}`);
}); 