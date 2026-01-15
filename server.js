//Inizializzazione server express
const express = require("express");
const app = express();
const PORT = 3000;

//import del raouter
const articlesRouter = require("./routes/articlesRouter");
// import del subsrouter
const subscribeRouter = require("./routes/subscribeRouter");



//Middleware import
const notFound = require("./middleware/notFound");
const serverError = require("./middleware/serverError");
const cors = require("cors");

app.use(express.static("public"));
app.use(cors());
app.use(express.json());

//Rotta radice
app.get("/", (req, res) => {
  res.send("server and routes  started");
});

//Router + assegnazione prefisso
app.use("/api/articles", articlesRouter);
app.use("/api/subscribe", subscribeRouter);

app.use(serverError);
app.use(notFound);

app.listen(PORT, () => {
  console.log(`server listener on http://localhost:${PORT}`);
});
