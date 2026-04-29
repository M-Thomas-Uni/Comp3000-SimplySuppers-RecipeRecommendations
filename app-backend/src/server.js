const express = require('express');
const { neo4j_startup, calculate_tf_weights_and_normals } = require('./neo4j_setup');
const { test_ready, get_recipe_by_id, get_top_20_recipes } = require('./neo4j_operations');

const app = express();
const port = 9000;

neo4j_startup();
calculate_tf_weights_and_normals();

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
})

app.get('/recipe/top20', async (req, res) => {
  try {
    const result = await get_top_20_recipes;
    if (result['code'] == 200) {
       return res.json(result['recipe'])
    } else if (result['code'] == 204) {
        return res.sendStatus(204);
    } else {
      res.sendStatus(503);
    }
  }  catch (err) {
        console.error(`Error fetching top 20 recipes:`, err);
        res.sendStatus(500);
  }
})

app.listen(port, () => {
  console.log(`Backend server listening on port: ${port}`);
}); 