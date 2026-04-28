const express = require('express');
const {neo4j_startup} = require('./neo4j_setup');
const { test_ready, get_recipe_by_id } = require('./neo4j_operations');

const app = express();
const port = 9000;

neo4j_startup();

app.get('/', (req, res) => {
  res.send('Test get');
});

app.get('/healthcheck', async (req, res) => {
  const db_conn_test = await test_ready();

  if (db_conn_test['Successful?']) {
    console.log("Healtcheck returning 200");
    res.sendStatus(200);
  } else {
    console.log("Healtcheck returning 503");
    res.sendStatus(503);
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
        return res.status(204).json(null);
    } else {
      res.sendStatus(503);
    }
  }  catch (err) {
        console.error(`Error fetching recipe (${req.params.id}):`, err);
        res.status(500).json({ error: "Internal Server Error" });
  }
})

app.listen(port, () => {
  console.log(`Backend server listening on port: ${port}`);
}); 