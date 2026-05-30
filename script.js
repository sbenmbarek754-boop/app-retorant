document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reservationForm");
  const list = document.getElementById("reservationsList");

  const btnAll = document.getElementById("btnAll");
  const btnToday = document.getElementById("btnToday");
  const countAllEl = document.getElementById("countAll");
  const countTodayEl = document.getElementById("countToday");

  let toutesLesReservations = [];
  let filtreActuel = "all";

  fetchReservations();

  // 1. Ajouter une réservation (Simplifié, uniquement POST)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nom = document.getElementById("nom").value.trim();
    const date = document.getElementById("date").value;
    const personnes = document.getElementById("personnes").value;

    if (!nom || !date || !personnes) return;

    const btn = form.querySelector("button");
    const originalText = btn.innerHTML;
    btn.innerHTML = "Traitement...";
    btn.disabled = true;

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, date, personnes }),
      });

      if (response.ok) {
        form.reset();
        alert(
          "Votre demande a bien été envoyée au restaurant. Veuillez patienter pour la confirmation.",
        );
        fetchReservations();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });

  // 2. Gérer les statuts (Accepter / Refuser)
  window.changerStatut = async (id, nouveauStatut) => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      if (response.ok) fetchReservations();
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
    }
  };

  // 3. Supprimer une réservation
  window.supprimerResa = async (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
      try {
        const response = await fetch(`/api/reservations/${id}`, {
          method: "DELETE",
        });
        if (response.ok) fetchReservations();
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  // --- Filtres et Affichage ---
  btnAll.addEventListener("click", () => {
    filtreActuel = "all";
    btnAll.classList.add("active");
    btnToday.classList.remove("active");
    afficherDonnees();
  });

  btnToday.addEventListener("click", () => {
    filtreActuel = "today";
    btnToday.classList.add("active");
    btnAll.classList.remove("active");
    afficherDonnees();
  });

  async function fetchReservations() {
    try {
      const response = await fetch("/api/reservations");
      toutesLesReservations = await response.json();
      afficherDonnees();
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  function afficherDonnees() {
    list.innerHTML = "";
    const aujourdhui = new Date();
    const aujourdhuiChaîne = aujourdhui.toISOString().split("T")[0];

    const nbTotal = toutesLesReservations.length;
    const nbAujourdhui = toutesLesReservations.filter(
      (resa) => resa.date.split("T")[0] === aujourdhuiChaîne,
    ).length;

    countAllEl.textContent = nbTotal;
    countTodayEl.textContent = nbAujourdhui;

    let listeFiltrée = toutesLesReservations;
    if (filtreActuel === "today") {
      listeFiltrée = toutesLesReservations.filter(
        (resa) => resa.date.split("T")[0] === aujourdhuiChaîne,
      );
    }

    if (listeFiltrée.length === 0) {
      list.innerHTML =
        '<div class="empty-state">Aucune réservation trouvée.</div>';
      return;
    }

    [...listeFiltrée].reverse().forEach((resa) => {
      const dateObj = new Date(resa.date);
      const dateFormatee = dateObj.toLocaleDateString("fr-FR");
      const heureFormatee = dateObj.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const estAujourdhui = resa.date.split("T")[0] === aujourdhuiChaîne;

      let badgeClass = "status-attente";
      if (resa.statut === "Confirmée") badgeClass = "status-confirme";
      if (resa.statut === "Refusée") badgeClass = "status-refuse";

      const card = document.createElement("div");
      card.className = "resa-item";

      // Le bouton modifier a été retiré de la liste des actions
      card.innerHTML = `
                <div class="resa-header">
                    <div>
                        <span class="resa-name">${resa.nom}</span>
                        <span class="status-badge ${badgeClass}">${resa.statut}</span>
                    </div>
                    ${estAujourdhui ? '<span class="tag-today">Aujourd\'hui</span>' : ""}
                </div>
                <div class="resa-details">
                    <span>📅 ${dateFormatee}</span>
                    <span>⏰ ${heureFormatee}</span>
                    <span>👥 ${resa.personnes} pers.</span>
                </div>
                <div class="resa-actions">
                    ${
                      resa.statut === "En attente"
                        ? `
                        <button class="btn-icon btn-accept" onclick="changerStatut('${resa.id}', 'Confirmée')">✅ Accepter</button>
                        <button class="btn-icon btn-reject" onclick="changerStatut('${resa.id}', 'Refusée')">❌ Refuser</button>
                    `
                        : ""
                    }
                    <button class="btn-icon btn-delete" onclick="supprimerResa('${resa.id}')">🗑️ Supprimer</button>
                </div>
            `;
      list.appendChild(card);
    });
  }
});
