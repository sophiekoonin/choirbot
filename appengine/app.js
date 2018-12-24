const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello world! SHEbot v0.4');
});

const PORT = process.env.PORT || 6060;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
