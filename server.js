const dotenv=require('dotenv')
dotenv.config()

const express=require('express')
const app = express();
const connectToDB = require('./config/db');

connectToDB();
const PORT=process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const userRoutes = require('./routes/user.routes');
const propertyRoutes = require('./routes/properties.routes');

app.use('/api/user', userRoutes);
app.use('/api/property', propertyRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});