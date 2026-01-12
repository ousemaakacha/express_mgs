const express = require("express");
const app = express();
const cors = require("cors");
const PORT = 3000;
const db = require("./data/db");
const notFound = require("./middleware/notFound");
const serverError = require("./middleware/serverError");

const articlesRouter = require("./routes/articlesRouter");

app.use(express.static("public"));
app.use(cors())

app.use(express.json());

app.get("/", (req, res) => {
  res.send("server and routes  started");
});

app.use("/api/articles", articlesRouter);

app.use(serverError);
app.use(notFound);

app.listen(PORT, () => {
  console.log(`server listener on http://localhost:${PORT}`);
});
