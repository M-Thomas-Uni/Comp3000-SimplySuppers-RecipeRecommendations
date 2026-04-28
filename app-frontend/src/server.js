const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('base_layout', {title: "Simply Suppers", content: 'pages/index'});
});

app.listen(port, () => {
  console.log(`Frontend server listening on port: ${port}`);
}); 