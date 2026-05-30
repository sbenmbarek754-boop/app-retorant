const http = require("http");
const fs = require("fs");
const path = require("path");

let reservations = [];

const server = http.createServer((req, res) => {
  // On vérifie si la requête concerne notre API
  if (req.url.startsWith("/api/reservations")) {
    // GET : Récupérer toutes les réservations
    if (req.method === "GET" && req.url === "/api/reservations") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(reservations));
      return;
    }

    // POST : Ajouter une nouvelle réservation
    if (req.method === "POST" && req.url === "/api/reservations") {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => {
        try {
          const nouvelleReservation = JSON.parse(body);
          nouvelleReservation.id = Date.now().toString();

          // NOUVEAU : On définit le statut par défaut
          nouvelleReservation.statut = "En attente";

          reservations.push(nouvelleReservation);

          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: "Réservation en attente de confirmation !",
            }),
          );
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Données invalides" }));
        }
      });
      return;
    }

    const id = req.url.split("/")[3];

    // DELETE : Supprimer une réservation
    if (req.method === "DELETE" && id) {
      reservations = reservations.filter((resa) => resa.id !== id);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Réservation supprimée" }));
      return;
    }

    // PUT : Modifier une réservation existante
    if (req.method === "PUT" && id) {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => {
        const donneesModifiees = JSON.parse(body);
        const index = reservations.findIndex((resa) => resa.id === id);

        if (index !== -1) {
          reservations[index] = { ...reservations[index], ...donneesModifiees };
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Réservation modifiée" }));
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Réservation non trouvée" }));
        }
      });
      return;
    }
  }

  // --- GESTION DES FICHIERS STATIQUES ---
  let filePath = "." + req.url;
  if (filePath === "./") filePath = "./index.html";

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
  };
  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Fichier introuvable");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Le serveur est démarré. Va sur : http://localhost:${PORT}`);
});
