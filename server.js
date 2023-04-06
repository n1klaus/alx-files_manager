// eslint-disable-next-line import/no-extraneous-dependencies
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const dbClient = require('./utils/db');

const app = express();
const PORT = process.env.PORT || 5000;

setTimeout(() => {
  if (dbClient.isAlive()) {
    console.log('MongoDB is connected');
  } else {
    console.log('MongoDB is not connected');
  }
}, 3000);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
