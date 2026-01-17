const db = require("../data/db");
const nodemailer = require("nodemailer");

// Configurazione Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT || 2525),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

// Funzione per inviare email di conferma ordine
const sendOrderConfirmationEmail = async (orderData) => {
  const { email, name, orderId, total } = orderData;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: `Conferma Ordine #${orderId}`,
    text: `Ciao ${name},
    grazie per il tuo acquisto! ✅
    Il tuo ordine #${orderId} è confermato.

    Totale: € ${total.toFixed(2)}

    Ti aggiorneremo appena verrà spedito.
    Per assistenza, rispondi pure a questa email.

    A presto, Il team di Metal Games Solid Shop`,
    html: `<div style="margin:0;padding:0;background:#0b0f14;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      
      <div style="background:#111827;border:1px solid #243244;border-radius:16px;overflow:hidden;">
        
        <!-- Header -->
        <div style="padding:20px 22px;background:linear-gradient(135deg,#111827,#0b1220);border-bottom:1px solid #243244;">
          <div style="font-size:14px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">
            Metal Games Solid Shop
          </div>
          <div style="margin-top:6px;font-size:22px;font-weight:700;color:#e5e7eb;">
            Ordine confermato ✅
          </div>
          <div style="margin-top:6px;font-size:14px;color:#cbd5e1;">
            Conferma ordine <span style="color:#e5e7eb;font-weight:700;">#${orderId}</span>
          </div>
        </div>

        <!-- Body -->
        <div style="padding:22px;color:#e5e7eb;">
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#e5e7eb;">
            Ciao <strong>${name}</strong>,<br/>
            grazie per il tuo acquisto! Abbiamo ricevuto correttamente il tuo ordine e lo stiamo già preparando.
          </p>

          <div style="margin:18px 0;padding:14px 16px;border:1px solid #243244;border-radius:12px;background:#0b1220;">
            <div style="font-size:13px;color:#94a3b8;margin-bottom:8px;">Riepilogo ordine</div>
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:14px;line-height:1.7;">
              <div style="color:#cbd5e1;">Numero ordine</div>
              <div style="color:#e5e7eb;font-weight:700;">#${orderId}</div>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:14px;line-height:1.7;margin-top:6px;">
              <div style="color:#cbd5e1;">Totale</div>
              <div style="color:#22c55e;font-weight:800;">€ ${total.toFixed(2)}</div>
            </div>
          </div>

          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#cbd5e1;">
            Riceverai un altro aggiornamento appena l’ordine verrà spedito (con eventuale tracking).
          </p>

          <div style="margin-top:16px;padding:14px 16px;border-radius:12px;background:#0f172a;border:1px dashed #334155;">
            <div style="font-size:13px;color:#94a3b8;margin-bottom:6px;">Hai bisogno di aiuto?</div>
            <div style="font-size:14px;color:#e5e7eb;line-height:1.6;">
              Rispondi direttamente a questa email e ti aiutiamo al volo.
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 22px;border-top:1px solid #243244;background:#0b1220;">
          <div style="font-size:12px;color:#94a3b8;line-height:1.5;">
            Questa è un’email automatica di conferma ordine.<br/>
            © ${new Date().getFullYear()} Metal Games Solid Shop
          </div>
        </div>

      </div>
    </div>
      </div>`,
  });
};

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

    //Ordinamenti validi - sort = ordinamento
    const validSorts = {
      name_asc: "a.name ASC",
      name_desc: "a.name DESC",
      price_asc: "a.price ASC",
      price_desc: "a.price DESC",
    };

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

    //Filtro per name (può convivere con la categoria) - ricerca parziale con LIKE
    if (req.query.name) {
      sql += ` AND a.name LIKE ?`;
      values.push(`%${req.query.name}%`);
    }

    //Filtro per ordinamento(sort = ordinamento)
    if (!req.query.name && req.query.sort && validSorts[req.query.sort]) {
      sql += ` ORDER BY ${validSorts[req.query.sort]}`;
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
    const { name, surname, email, address, items, termsAccepted } = req.body;

    if (termsAccepted !== true) {
      return res.status(400).json({
        error: "Accettare i termini e le condizioni",
      });
    }

    //Validazioni per nome-cognome ed email
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    //Validazione del form. ".test" è un metodo degli oggetti RegExp, controlla ugualianza
    if (!name || typeof name !== "string" || !nameRegex.test(name)) {
      return res.status(400).json({
        error: "Nome non valido. Sono ammesse solo lettere.",
      });
    }

    if (!surname || typeof surname !== "string" || !nameRegex.test(surname)) {
      return res.status(400).json({
        error: "Cognome non valido. Sono ammesse solo lettere.",
      });
    }

    if (!email || typeof email !== "string" || !emailRegex.test(email)) {
      return res.status(400).json({
        error: "Email non valida. Formato email errato.",
      });
    }

    if (!address || typeof address !== "string") {
      return res.status(400).json({
        error: "Indirizzo mancante o non valido.",
      });
    }

    //Controllo sull'array di articoli
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrello vuoto o non valido" });
    }

    //Ottieni una connessione dal pool per usare le transazioni
    db.getConnection((err, connection) => {
      if (err)
        return res.status(500).json({ error: true, message: err.message });

      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          return res.status(500).json(err);
        }

        let orderTotal = 0;
        let completed = 0;

        //Recupero prezzi e controllo stock
        for (const item of items) {
          const articleId = Number(item.article_id);
          const qty = Number(item.quantity);

          if (isNaN(articleId) || isNaN(qty) || qty <= 0) {
            return connection.rollback(() => {
              connection.release();
              res.status(400).json({ error: "Dati carrello non validi" });
            });
          }

          const priceSql = `
          SELECT price, quantity
          FROM articles
          WHERE id = ?
        `;

          connection.query(priceSql, [articleId], (err, rows) => {
            if (err || rows.length === 0) {
              return connection.rollback(() => {
                connection.release();
                res.status(404).json({ error: "Articolo non trovato" });
              });
            }

            const article = rows[0];

            if (article.quantity < qty) {
              return connection.rollback(() => {
                connection.release();
                res.status(409).json({
                  error: "Stock insufficiente per uno o più articoli",
                });
              });
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

              connection.query(
                orderSql,
                [name, surname, email, address, orderTotal],
                (err, orderResult) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json(err);
                    });
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

                    connection.query(
                      updateSql,
                      [item.quantity, item.article_id],
                      (err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            res.status(500).json(err);
                          });
                        }

                        stockUpdated++;

                        //Commit finale
                        if (stockUpdated === items.length) {
                          connection.commit(async (err) => {
                            if (err) {
                              return connection.rollback(() => {
                                connection.release();
                                res.status(500).json(err);
                              });
                            }

                            connection.release();

                            // Invio email di conferma ordine
                            try {
                              await sendOrderConfirmationEmail({
                                email,
                                name,
                                surname,
                                orderId,
                                total: orderTotal,
                                address,
                              });
                              console.log(
                                `Email di conferma inviata a ${email} per ordine #${orderId}`,
                              );
                            } catch (emailErr) {
                              console.error("Errore invio email:", emailErr);
                              // Non blocchiamo l'ordine se l'email fallisce
                            }

                            res.json({
                              message: "Checkout completato con successo",
                              order_id: orderId,
                              total: orderTotal,
                            });
                          });
                        }
                      },
                    );
                  }
                },
              );
            }
          });
        }
      });
    });
  },
};

module.exports = articlesController;
