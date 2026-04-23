const express = require('express');
const {neo4j_startup} = require('./neo4j_setup');
const { test_ready } = require('./neo4j_operations');

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

app.listen(port, () => {
  console.log(`Backend server listening on port: ${port}`);
}); 