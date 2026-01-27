const express = require('express');
const cors = require('cors');
const db = require('./db');
const loginRoutes = require('./routes/loginroutes');

const app = express();
app.use(cors({origin: 'http://localhost:3000',credentials: true}));
app.use(express.json());


app.use("api/", loginRoutes);

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});