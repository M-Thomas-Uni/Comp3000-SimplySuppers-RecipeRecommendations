const express = require('express');
const app = express();
const port = 9000;

app.get('/', (req, res) => {
  res.send('Test get');
});

app.listen(port, () => {
  console.log(`Backend server listening on port: ${port}`);
}); 