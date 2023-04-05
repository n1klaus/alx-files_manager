const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const dbClient = require('./utils/db');

const app = express();
const PORT = process.env.PORT || 5000;

(async () => {
  if (await dbClient.isAlive()) {
    console.log('MongoDB is connected');
  } else {
    console.log('MongoDB is not connected');
  }
})();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
