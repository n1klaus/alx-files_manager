const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
