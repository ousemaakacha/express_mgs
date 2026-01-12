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

  update: (req, res) => {
    const id = Number(req.params.id);
    const data = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }

    const allowedFields = [
      "name",
      "slug",
      "price",
      "image",
      "quantity",
      "genres",
      "pvp_pve",
      "pegi",
      "dimensions",
      "production_year",
      "production_house",
      "categorie_id",
    ];

    const fields = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ error: "Nessun campo valido da aggiornare" });
    }

    const sql = `
    UPDATE articles
    SET ${fields.join(", ")}
    WHERE id = ?
  `;

    values.push(id);

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Articolo non trovato" });
      }

      res.json({
        message: "Articolo aggiornato correttamente",
      });
    });
  },

  ////////

  checkout: (req, res) => {
    const items = req.body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrello vuoto o non valido" });
    }

    db.beginTransaction((err) => {
      if (err) return res.status(500).json(err);

      let completed = 0;

      for (const item of items) {
        const articleId = Number(item.article_id);
        const qty = Number(item.quantity);

        if (isNaN(articleId) || isNaN(qty) || qty <= 0) {
          return db.rollback(() =>
            res.status(400).json({ error: "Dati carrello non validi" })
          );
        }

        const sql = `
        UPDATE articles
        SET quantity = quantity - ?
        WHERE id = ?
          AND quantity >= ?
      `;

        db.query(sql, [qty, articleId, qty], (err, result) => {
          if (err) {
            return db.rollback(() => res.status(500).json(err));
          }

          if (result.affectedRows === 0) {
            return db.rollback(() =>
              res.status(409).json({
                error: "Stock insufficiente per uno o più articoli",
              })
            );
          }

          completed++;

          if (completed === items.length) {
            db.commit((err) => {
              if (err) {
                return db.rollback(() => res.status(500).json(err));
              }

              res.json({
                message: "Checkout completato con successo",
              });
            });
          }
        });
      }
    });
  },
};

module.exports = articlesController;
