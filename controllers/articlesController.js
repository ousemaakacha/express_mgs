const db = require("../data/db");

const articlesController = {
  //Risponde con TUTTI gli articoli
  index: (req, res) => {
    // Lista delle categorie valide
    const validCategories = [
      "Videogames",
      "Consoles",
      "Collectibles",
      "Accessories",
    ];

    //Query di base
    let sql = `
    SELECT
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

    const values = [];

    //Filtro per categoria (se valido)
    if (req.query.categorie && validCategories.includes(req.query.categorie)) {
      sql += ` AND c.categorie = ?`;
      values.push(req.query.categorie);
    }

    //Filtro per name (può convivere con la categoria)
    if (req.query.name) {
      sql += ` AND a.name = ?`;
      values.push(req.query.name);
    }

    //Query al database
    db.query(sql, values, (err, results) => {
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

  //Mostra un SINGOLO articolo
  show: (req, res) => {
    //Recupero slug passato da frontend
    const { slug } = req.params;

    //Sql con parametro dinamico
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
WHERE a.slug = ?`;

    db.query(sql, [slug], (err, results) => {
      //in caso di errore:
      if (err) {
        console.error("Errore nella ricerca singolo prodotto:", err);
        return res.status(404).json({
          error: true,
          message: "404 risorsa non trovata",
        });
      }
      //altrimenti
      res.json(results);
    });
  },

  //Inserimento nuovo articolo
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

  //Update nuovo articolo lato Admin
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
    const { name, surname, email, address, items } = req.body;

    //Validazioni base
    if (!name || !surname || !email || !address) {
      return res.status(400).json({ error: "Dati cliente mancanti" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrello vuoto o non valido" });
    }

    db.beginTransaction((err) => {
      if (err) return res.status(500).json(err);

      let orderTotal = 0;
      let completed = 0;

      //Recupero prezzi e controllo stock
      for (const item of items) {
        const articleId = Number(item.article_id);
        const qty = Number(item.quantity);

        if (isNaN(articleId) || isNaN(qty) || qty <= 0) {
          return db.rollback(() =>
            res.status(400).json({ error: "Dati carrello non validi" })
          );
        }

        const priceSql = `
        SELECT price, quantity
        FROM articles
        WHERE id = ?
      `;

        db.query(priceSql, [articleId], (err, rows) => {
          if (err || rows.length === 0) {
            return db.rollback(() =>
              res.status(404).json({ error: "Articolo non trovato" })
            );
          }

          const article = rows[0];

          if (article.quantity < qty) {
            return db.rollback(() =>
              res.status(409).json({
                error: "Stock insufficiente per uno o più articoli",
              })
            );
          }

          //Calcolo totale
          orderTotal += article.price * qty;

          completed++;

          //Quando abbiamo calcolato tutto il totale
          if (completed === items.length) {
            //Inserimento ordine
            const orderSql = `
            INSERT INTO orders (name, surname, email, address, total)
            VALUES (?, ?, ?, ?, ?)
          `;

            db.query(
              orderSql,
              [name, surname, email, address, orderTotal],
              (err, orderResult) => {
                if (err) {
                  return db.rollback(() => res.status(500).json(err));
                }

                const orderId = orderResult.insertId;
                let stockUpdated = 0;

                //Aggiornamento stock
                for (const item of items) {
                  const updateSql = `
                  UPDATE articles
                  SET quantity = quantity - ?
                  WHERE id = ?
                `;

                  db.query(
                    updateSql,
                    [item.quantity, item.article_id],
                    (err) => {
                      if (err) {
                        return db.rollback(() => res.status(500).json(err));
                      }

                      stockUpdated++;

                      //Commit finale
                      if (stockUpdated === items.length) {
                        db.commit((err) => {
                          if (err) {
                            return db.rollback(() => res.status(500).json(err));
                          }

                          res.json({
                            message: "Checkout completato con successo",
                            order_id: orderId,
                            total: orderTotal,
                          });
                        });
                      }
                    }
                  );
                }
              }
            );
          }
        });
      }
    });
  },
};

module.exports = articlesController;
