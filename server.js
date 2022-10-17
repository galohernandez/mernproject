const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json()); // para que entienda los jsons
const authRoute = require("./routes/auth"); // para que sepa la ruta de los endpoints
const userRoute = require("./routes/user"); // ruta enpoint para users
const mongodbConnection = require("./config/mongodbConnection");
const port = 5000;

app.use("/api/auth", authRoute); // cuando el path sea api/auth vaya a buscar en authRoute
app.use("/api/user", userRoute);

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}`));
