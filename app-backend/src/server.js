const express = require('express');
const { neo4j_startup } = require('./neo4j_setup');
const { test_ready, get_recipe_by_id, get_top_recipes, get_cbf_recommended, get_top_in_cat, get_top_in_keyw } = require('./neo4j_operations');

const app = express();
const port = 9000;

neo4j_startup();

app.get('/', (req, res) => {
  res.send('Test get');
});

app.get('/healthcheck', async (req, res) => {
  try {
    const result = await test_ready();

    if (result['code'] == 200) {
      console.log("Healthcheck returning 200");
      res.sendStatus(200);
    } else {
      res.sendStatus(503);
    }
  }  catch (err) {
        console.error(`Error performing healthcheck:`, err);
        res.sendStatus(500);
  }
})

app.get('/recipe/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await get_recipe_by_id(id);
    if (result['code'] == 200) {
      if (result['recipe']) {
        return res.json(result['recipe'])
      }
    } else if (result['code'] == 204) {
        return res.sendStatus(204);
    } else {
      res.sendStatus(503);
    }
  }  catch (err) {
        console.error(`Error fetching recipe (${req.params.id}):`, err);
        res.sendStatus(500);
  }
});

app.get('/top/recipes/:lim', async (req, res) => {
  try {
    const lim = req.params.lim;
    const result = await get_top_recipes(lim);
    if (result['code'] == 200) {
       return res.json(result['recipes'])
    } else if (result['code'] == 204) {
        return res.sendStatus(204);
    } else {
      res.sendStatus(503);
    }
  }  catch (err) {
        console.error(`Error fetching top recipes:`, err);
        res.sendStatus(500);
  }
});

app.get('/top/category/:id/:lim', async (req, res) => {
  try {
    const id = req.params.id;
    const lim = req.params.lim;
    const result = await get_top_in_cat(id, lim);
    if (result['code'] == 200) {
       return res.json(result)
    } else if (result['code'] == 204) {
        return res.sendStatus(204);
    } else {
      res.sendStatus(503);
    }
  }  catch (err) {
        console.error(`Error fetching top recipes:`, err);
        res.sendStatus(500);
  }
});

app.get('/top/keyword/:id/:lim', async (req, res) => {
  try {
    const id = req.params.id;
    const lim = req.params.lim;
    const result = await get_top_in_keyw(id, lim);
    if (result['code'] == 200) {
       return res.json(result)
    } else if (result['code'] == 204) {
        return res.sendStatus(204);
    } else {
      res.sendStatus(503);
    }
  }  catch (err) {
        console.error(`Error fetching top recipes:`, err);
        res.sendStatus(500);
  }
})

app.get('/similarto/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await get_cbf_recommended(id, 20);
    const subject = await get_recipe_by_id(id);

    if (result['code'] == 200 && subject['code'] == 200) {
      if (result['recipes'] && subject['recipe']) {
        console.log("Returning recommendations")
        return res.json({
          'subject': subject['recipe'],
          'recipes': result['recipes']});
      }
    } else if (result['code'] == 204 || subject['code'] == 204) {
        console.log(`Status 204, not found. Recommender result code: ${result['code']} - Subject result code: ${subject['code']}`)
        return res.sendStatus(204);
    } else {
      res.sendStatus(503);
    }
  }  catch (err) {
        console.error(`Error fetching recipes (${req.params.id}):`, err);
        res.sendStatus(500);
  }
})

app.listen(port, () => {
  console.log(`Backend server listening on port: ${port}`);
}); 