const db = require("../data/db");

const articlesController = {
  //Risponde con TUTTI gli articoli
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

    //Interrogazione del database
    db.query(sql, (err, results) => {
      //In caso di errore:
      if (err) {
        console.error("Errore nella query dei prodotti:", err);
        return res.status(500).json({
          error: true,
          message: "Errore interno del server",
        });
      }
      //altrimenti:
      res.json(results);
    });
  },

  /////////

  //Mostra un SINGOLO articolo
  show: (req, res) => {
    //Recupero slug passato da frontend
    const { id } = req.params;

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
WHERE a.slug = '${id}'`;

    db.query(sql, (err, results) => {
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
    const items = req.body.items;
    //SE items non è array oppure è un array di lunghezza zero
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrello vuoto o non valido" });
    }

    db.beginTransaction((err) => {
      if (err) return res.status(500).json(err);

      let completed = 0;

      //Ciclo che scorre items, ovvero il carrello
      for (const item of items) {
        //recupero del singolo articolo , id e quantità
        const articleId = Number(item.article_id);
        const qty = Number(item.quantity);

        //controllo che id e quantità siano numeriche(perchè numeriche nel database)
        if (isNaN(articleId) || isNaN(qty) || qty <= 0) {
          return db.rollback(() =>
            res.status(400).json({ error: "Dati carrello non validi" })
          );
        }

        //Sql del singolo articolo, che cambio di giro in giro
        const sql = `
        UPDATE articles
        SET quantity = quantity - ? 
        WHERE id = ? 
          AND quantity >= ? 
      `;

        //Interrogazione del database
        db.query(sql, [qty, articleId, qty], (err, result) => {
          if (err) {
            //rollback fa in modo che operazini precedenti non abbiano effetto nel DB
            return db.rollback(() => res.status(500).json(err));
          }

          //Se non hai avuto effetto nel DB
          if (result.affectedRows === 0) {
            return db.rollback(() =>
              res.status(409).json({
                error: "Stock insufficiente per uno o più articoli",
              })
            );
          }

          completed++;

          //Controllo che il ciclo for abbia girato per tutti il carrello
          if (completed === items.length) {
            //Permette l'interrogazione atomico del database
            db.commit((err) => {
              //ogni interrogazinoe atomica ne controlla eventuali errori
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
