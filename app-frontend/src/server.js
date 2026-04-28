const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('base_layout', {title: "Simply Suppers", content: 'pages/index'});
});

app.get('/test/recipe-card/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const response = await fetch(`http://app-backend:9000/recipe/${id}`);

    if (response.status == 204) {
      return res.render('base_layout', {title: "Simply Suppers", content: 'partials/404'});
    }

    if (!response.ok) {
      return res.status(500).render('base_layout', {title: "Simply Suppers", content: 'partials/404'});
    }

    const recipe = await response.json();
    res.render('base_layout', {title: "Simply Suppers", content: 'partials/recipe-card', recipe: recipe});
    } catch (err) {
      console.error("Error in test recipe-card route: ", err);
      res.sendStatus(500);
    }
});

app.listen(port, () => {
  console.log(`Frontend server listening on port: ${port}`);
}); 