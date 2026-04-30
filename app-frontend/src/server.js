const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/static', express.static('src/public'))

app.get('/', async (req, res) => {
  try {
    console.log("Fetching top");
    const response = await fetch(`http://app-backend:9000/top/recipes/21`);
    console.log("recieved top");


    if (response.status == 204) {
      console.log("204 err");
      return res.render('base_layout', {title: "Simply Suppers", content: 'partials/404'});
    }

    if (!response.ok) {
      console.log("Resp not OK");
      return res.status(500).render('base_layout', {title: "Simply Suppers", content: 'partials/404'});
    }
    console.log("Awaiting JSON");
    const data = await response.json();
    console.log("Rendering..")
    res.render('base_layout', {title: "Simply Suppers", content: 'pages/home', top_recipes:data});
    } catch (err) {
      console.error("Error in index route: ", err);
      res.sendStatus(500);
    }

});

app.get('/top/category/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Fetching top");
    const response = await fetch(`http://app-backend:9000/top/category/${id}/21`);
    console.log("recieved top");


    if (response.status == 204) {
      console.log("204 err");
      return res.render('base_layout', {title: "Simply Suppers", content: 'partials/404'});
    }

    if (!response.ok) {
      console.log("Resp not OK");
      return res.status(500).render('base_layout', {title: "Simply Suppers", content: 'partials/404'});
    }
    console.log("Awaiting JSON");
    const data = await response.json();
    console.log("Rendering..")
    res.render('base_layout', {title: "Simply Suppers", content: 'pages/topcats', 'CategoryName':data.CategoryName, recipes:data.recipes});
    } catch (err) {
      console.error("Error in index route: ", err);
      res.sendStatus(500);
    }
});

app.get('/top/keyword/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Fetching top");
    const response = await fetch(`http://app-backend:9000/top/keyword/${id}/21`);
    console.log("recieved top");


    if (response.status == 204) {
      console.log("204 err");
      return res.render('base_layout', {title: "Simply Suppers", content: 'partials/404'});
    }

    if (!response.ok) {
      console.log("Resp not OK");
      return res.status(500).render('base_layout', {title: "Simply Suppers", content: 'partials/404'});
    }
    console.log("Awaiting JSON");
    const data = await response.json();
    console.log("Rendering..")
    res.render('base_layout', {title: "Simply Suppers", content: 'pages/topkeyw', 'KeywordName':data.KeywordName, recipes:data.recipes});
    } catch (err) {
      console.error("Error in index route: ", err);
      res.sendStatus(500);
    }
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

app.get('/similarto/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const response = await fetch(`http://app-backend:9000/similarto/${id}`);

    if (response.status == 204) {
      return res.render('base_layout', {title: "Simply Suppers", content: 'partials/404'});
    }

    if (!response.ok) {
      return res.status(500).render('base_layout', {title: "Simply Suppers", content: 'partials/404'});
    }

    const data = await response.json();
    res.render('base_layout', {title: "Simply Suppers", content: 'pages/similar', subject:data['subject'], recipes: data['recipes']});
    } catch (err) {
      console.error("Error in test recipe-card route: ", err);
      res.sendStatus(500);
    }
});

app.listen(port, () => {
  console.log(`Frontend server listening on port: ${port}`);
}); 