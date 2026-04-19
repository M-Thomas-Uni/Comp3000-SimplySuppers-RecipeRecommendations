const express = require('express');
const {neo4j_startup} = require('./neo4j_setup');

const app = express();
const port = 9000;

neo4j_startup();

app.get('/', (req, res) => {
  res.send('Test get');
});

app.listen(port, () => {
  console.log(`Backend server listening on port: ${port}`);
}); 