const db = require("../data/db");

const articlesController = {
  index: (req, res) => {
    let sql = `SELECT
    a.id,
    a.name,
    a.slug,
    a.price,
    a.image,
    a.quantity,
    a.pvp_pve,
    a.dimensions,
    a.genres,
    a.pegi,
    a.production_year,
    a.production_house,
    c.categorie
FROM articles AS a
LEFT JOIN categories AS c 
    ON a.categorie_id = c.id
WHERE 1=1
`;

    if (req.query.name) {
      sql += ` AND name = '${req.query.name}'`;
    }

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Errore nella query dei prodotti:", err);
        return res.status(500).json({
          error: true,
          message: "Errore interno del server",
        });
      }

      res.json(results);
    });
  },

  /////////

  show: (req, res) => {
    const { id } = req.params;

    let sql = `SELECT
    a.id,
    a.name,
    a.slug,
    a.price,
    a.image,
    a.quantity,
    a.pvp_pve,
    a.dimensions,
    a.genres,
    a.pegi,
    a.production_year,
    a.production_house,
    c.categorie
FROM articles AS a
LEFT JOIN categories AS c 
    ON a.categorie_id = c.id
WHERE a.id = ${id}`;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Errore nella ricerca singolo prodotto:", err);
        return res.status(404).json({
          error: true,
          message: "404 risorsa non trovata",
        });
      }
      res.json(results);
    });
  },

  store: (req, res) => {
    const data = req.body;

    const allowedFields = [
      "name",
      "slug",
      "price",
      "image",
      "quantity",
      "pvp_pve",
      "dimensions",
      "genres",
      "pegi",
      "production_year",
      "production_house",
      "categorie_id",
    ];

    const columns = [];
    const placeholders = [];
    const values = [];

    for (const field of allowedFields) {
      if (field in data) {
        columns.push(field);
        placeholders.push("?");
        values.push(data[field]);
      }
    }

    const sql = `
    INSERT INTO articles (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
  `;

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Errore nella query di inserimento:", err);
        return res.status(500).json({
          error: true,
          message: "Errore interno del server",
        });
      }

      res.status(201).json({
        message: "Articolo creato con successo",
        id: result.insertId,
      });
    });
  },
};

module.exports = articlesController;
