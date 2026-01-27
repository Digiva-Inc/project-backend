const express = require('express');
const cors = require('cors');
const db = require('./db');
const loginRoutes = require('./routes/loginroutes');


// This is the complete code of server js file


const app = express();
app.use(cors({origin: 'http://localhost:3000',credentials: true}));
app.use(express.json());

// Api Endpoints merge with routes file
app.use("api/", loginRoutes);

// App Running on port 5000
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});