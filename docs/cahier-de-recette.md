# Cahier de recette — jap-assistant

**Version** : 1.0  
**Date** : 2026-06-28  
**Environnement cible** : Production  
**Application** : jap-assistant-web (Angular 19) + jap-assistant-backend (Django)

---

## Mode d'emploi

- Cocher la case ✅ lorsqu'un scénario est validé, ❌ si un défaut est constaté.
- Noter le défaut dans une colonne « Observations » ou ouvrir un ticket dédié.
- Les **préconditions** doivent être vérifiées avant d'exécuter les étapes.
- Les scénarios sont indépendants sauf mention contraire.

### Comptes de test recommandés

| Rôle | Email | Mot de passe |
|---|---|---|
| Testeur principal | test-jap@example.com | (à créer en AUTH-01) |
| Testeur secondaire | test-jap2@example.com | (à créer en AUTH-01) |

---

## 1. Authentification

### AUTH-01 — Inscription d'un nouvel utilisateur

- [ ] **Statut**

**Préconditions** : Aucune session active. L'email `test-jap@example.com` n'existe pas encore en base.

**Étapes** :
1. Naviguer vers `/auth/register`.
2. Saisir : Prénom `Test`, Nom `JAP`, Email `test-jap@example.com`, Mot de passe `test1234`, Confirmation `test1234`.
3. Cliquer sur **S'inscrire**.

**Résultat attendu** : L'utilisateur est connecté automatiquement et redirigé vers `/home`. Un toast de bienvenue apparaît.

---

### AUTH-02 — Inscription avec un email déjà utilisé

- [ ] **Statut**

**Préconditions** : L'email `test-jap@example.com` existe en base (créé en AUTH-01).

**Étapes** :
1. Naviguer vers `/auth/register`.
2. Saisir le même email `test-jap@example.com` avec n'importe quel mot de passe.
3. Cliquer sur **S'inscrire**.

**Résultat attendu** : Un message d'erreur indique que l'email est déjà utilisé. L'utilisateur reste sur la page d'inscription.

---

### AUTH-03 — Inscription avec mots de passe non concordants

- [ ] **Statut**

**Préconditions** : Aucune session active.

**Étapes** :
1. Naviguer vers `/auth/register`.
2. Saisir Mot de passe `test1234`, Confirmation `autrechose`.
3. Cliquer sur **S'inscrire**.

**Résultat attendu** : Un message d'erreur de validation s'affiche sous le champ confirmation. La requête n'est pas envoyée au serveur.

---

### AUTH-04 — Connexion valide

- [ ] **Statut**

**Préconditions** : Compte `test-jap@example.com` créé (AUTH-01). Aucune session active.

**Étapes** :
1. Naviguer vers `/auth/login`.
2. Saisir `test-jap@example.com` / `test1234`.
3. Cliquer sur **Se connecter**.

**Résultat attendu** : Redirection vers `/home`. Le nom de l'utilisateur est visible dans la barre de navigation ou le menu profil.

---

### AUTH-05 — Connexion avec mauvais mot de passe

- [ ] **Statut**

**Préconditions** : Compte `test-jap@example.com` créé.

**Étapes** :
1. Naviguer vers `/auth/login`.
2. Saisir `test-jap@example.com` / `mauvaismdp`.
3. Cliquer sur **Se connecter**.

**Résultat attendu** : Un message d'erreur indique que les identifiants sont incorrects. L'utilisateur reste sur `/auth/login`.

---

### AUTH-06 — Déconnexion

- [ ] **Statut**

**Préconditions** : Session active avec `test-jap@example.com`.

**Étapes** :
1. Depuis n'importe quelle page, cliquer sur le bouton de déconnexion.

**Résultat attendu** : Redirection vers `/auth/login`. L'accès à `/home` est refusé et redirige vers `/auth/login`.

---

### AUTH-07 — Accès à une page protégée sans connexion

- [ ] **Statut**

**Préconditions** : Aucune session active.

**Étapes** :
1. Naviguer directement vers `/home`.
2. Naviguer directement vers `/tournaments/setup/1`.

**Résultat attendu** : Redirection automatique vers `/auth/login` dans les deux cas.

---

### AUTH-08 — Accès aux pages d'auth avec une session active

- [ ] **Statut**

**Préconditions** : Session active.

**Étapes** :
1. Naviguer directement vers `/auth/login`.
2. Naviguer directement vers `/auth/register`.

**Résultat attendu** : Redirection automatique vers `/home` dans les deux cas.

---

### AUTH-09 — Réinitialisation du mot de passe (flux complet)

- [ ] **Statut**

**Préconditions** : Compte `test-jap@example.com` créé. Accès à la boîte email configurée.

**Étapes** :
1. Naviguer vers `/auth/password-forgotten`.
2. Saisir `test-jap@example.com` et valider.
3. Vérifier la réception d'un email de réinitialisation.
4. Cliquer sur le lien dans l'email (→ `/auth/reset-password?token=...`).
5. Saisir un nouveau mot de passe `nouveaumdp1234` et confirmer.
6. Valider.
7. Se connecter avec `test-jap@example.com` / `nouveaumdp1234`.

**Résultat attendu** :
- Étape 2 : Message de confirmation d'envoi.
- Étape 3 : Email reçu dans un délai raisonnable.
- Étape 6 : Redirection vers `/auth/login` avec toast de succès.
- Étape 7 : Connexion réussie.

---

### AUTH-10 — Réinitialisation avec token invalide ou expiré

- [ ] **Statut**

**Préconditions** : Aucune.

**Étapes** :
1. Naviguer vers `/auth/reset-password?token=tokeninvalide`.
2. Saisir et soumettre un nouveau mot de passe.

**Résultat attendu** : Message d'erreur indiquant que le token est invalide ou expiré.

---

### AUTH-11 — Consultation du profil utilisateur

- [ ] **Statut**

**Préconditions** : Session active.

**Étapes** :
1. Naviguer vers `/user-profile`.

**Résultat attendu** : Les informations affichées (prénom, nom, email) correspondent bien au compte connecté.

---

### AUTH-12 — Changement de mot de passe (profil)

- [ ] **Statut**

**Préconditions** : Session active avec `test-jap@example.com` (mot de passe actuel `test1234`).

**Étapes** :
1. Naviguer vers `/user-profile`.
2. Saisir Ancien mot de passe `test1234`, Nouveau mot de passe `test5678`, Confirmation `test5678`.
3. Valider.
4. Se déconnecter.
5. Se reconnecter avec `test-jap@example.com` / `test5678`.

**Résultat attendu** :
- Étape 3 : Toast de succès.
- Étape 5 : Connexion réussie. (Remettre ensuite le mot de passe à `test1234` pour les scénarios suivants.)

---

### AUTH-13 — Changement de mot de passe avec mauvais ancien mot de passe

- [ ] **Statut**

**Préconditions** : Session active.

**Étapes** :
1. Naviguer vers `/user-profile`.
2. Saisir Ancien mot de passe `mauvais`, Nouveau `test5678`, Confirmation `test5678`.
3. Valider.

**Résultat attendu** : Message d'erreur. Le mot de passe n'est pas modifié.

---

## 2. Gestion des tournois

### TOUR-01 — Création d'un tournoi

- [ ] **Statut**

**Préconditions** : Session active.

**Étapes** :
1. Naviguer vers `/home`.
2. Cliquer sur **Créer un tournoi**.
3. Renseigner : Nom `Tournoi Test A`, Catégorie `P100`, Date `2026-09-15`, Lieu `Club de Paris`, Ligue `Ile-de-France`, Genre `Homme`.
4. Valider.

**Résultat attendu** : Redirection vers la page de configuration du tournoi (`/tournaments/setup/:id`). Le tournoi apparaît dans la liste de `/home`.

---

### TOUR-02 — Affichage de la liste des tournois

- [ ] **Statut**

**Préconditions** : Au moins un tournoi créé (TOUR-01).

**Étapes** :
1. Naviguer vers `/home`.
2. Observer l'onglet **À venir**.
3. Passer à l'onglet **Passés**.

**Résultat attendu** : Le tournoi dont la date est dans les 3 prochains mois apparaît dans **À venir**. La pagination s'affiche si > 10 tournois.

---

### TOUR-03 — Filtres sur la liste des tournois

- [ ] **Statut**

**Préconditions** : Plusieurs tournois de catégories et genres différents existent.

**Étapes** :
1. Naviguer vers `/home`.
2. Appliquer le filtre Catégorie = `P100`.
3. Appliquer en plus le filtre Genre = `Homme`.
4. Retirer tous les filtres.

**Résultat attendu** :
- Étape 2 : Seuls les tournois P100 s'affichent.
- Étape 3 : Seuls les tournois P100 Homme s'affichent.
- Étape 4 : Tous les tournois réapparaissent.

---

### TOUR-04 — Modification des informations d'un tournoi

- [ ] **Statut**

**Préconditions** : Tournoi en statut DRAFT créé (TOUR-01). Session active.

**Étapes** :
1. Ouvrir le tournoi → onglet **Infos**.
2. Modifier le nom en `Tournoi Test A Modifié` et changer la catégorie en `P250`.
3. Sauvegarder.

**Résultat attendu** : Toast de succès. Les nouvelles valeurs sont affichées après rechargement.

---

### TOUR-05 — Statut du tournoi affiché (DRAFT)

- [ ] **Statut**

**Préconditions** : Tournoi sans paires et sans bracket (DRAFT).

**Étapes** :
1. Ouvrir le tournoi → onglet **Infos**.

**Résultat attendu** : Le badge de statut affiche `DRAFT`.

---

### TOUR-06 — Affichage du QR code et copie du lien public

- [ ] **Statut**

**Préconditions** : Tournoi créé.

**Étapes** :
1. Ouvrir le tournoi → onglet **Infos**.
2. Observer le QR code.
3. Cliquer sur le bouton **Copier le lien**.
4. Coller le lien dans un nouvel onglet.

**Résultat attendu** :
- Étape 2 : QR code visible et scannable.
- Étape 3 : Toast « Lien copié ».
- Étape 4 : Accès à la page publique du tournoi sans être connecté.

---

### TOUR-07 — Suppression d'un tournoi

- [ ] **Statut**

**Préconditions** : Tournoi en statut DRAFT. Session active.

**Étapes** :
1. Ouvrir le tournoi → onglet **Infos**.
2. Cliquer sur **Supprimer**.
3. Confirmer la suppression.

**Résultat attendu** : Redirection vers `/home`. Le tournoi n'apparaît plus dans la liste.

---

### TOUR-08 — Impossible de supprimer un tournoi STARTED ou FINISHED

- [ ] **Statut**

**Préconditions** : Tournoi en statut STARTED ou FINISHED.

**Étapes** :
1. Ouvrir le tournoi → onglet **Infos**.
2. Tenter de cliquer sur **Supprimer**.

**Résultat attendu** : Le bouton est absent ou désactivé. Ou une erreur s'affiche si la requête est faite manuellement.

---

### TOUR-09 — Accès au tournoi d'un autre utilisateur

- [ ] **Statut**

**Préconditions** : Deux comptes créés. Le compte `test-jap2@example.com` possède un tournoi dont on connaît l'ID.

**Étapes** :
1. Se connecter avec `test-jap@example.com`.
2. Naviguer vers `/tournaments/setup/<id_du_tournoi_de_jap2>`.

**Résultat attendu** : Erreur 403 ou 404. L'accès est refusé.

---

## 3. Gestion des paires (onglet Joueurs)

### PAIR-01 — Ajout manuel d'une paire

- [ ] **Statut**

**Préconditions** : Tournoi en statut DRAFT ou SET. Session active.

**Étapes** :
1. Ouvrir le tournoi → onglet **Joueurs**.
2. Cliquer sur **Ajouter une paire**.
3. Renseigner Joueur 1 : Prénom `Alice`, Nom `Dupont`, Licence `1234567A`, Téléphone `0600000001`, Ranking `150`.
4. Renseigner Joueur 2 : Prénom `Béatrice`, Nom `Martin`, Licence `2345678B`, Téléphone `0600000002`, Ranking `200`.
5. Valider.

**Résultat attendu** : La paire apparaît dans la liste avec le poids calculé (150 + 200 = 350).

---

### PAIR-02 — Modification d'une paire

- [ ] **Statut**

**Préconditions** : Au moins une paire créée (PAIR-01).

**Étapes** :
1. Cliquer sur le bouton **Modifier** d'une paire.
2. Changer le ranking du Joueur 1 à `120`.
3. Sauvegarder.

**Résultat attendu** : Le poids de la paire est mis à jour (120 + 200 = 320).

---

### PAIR-03 — Suppression d'une paire

- [ ] **Statut**

**Préconditions** : Au moins une paire créée. Tournoi non démarré.

**Étapes** :
1. Cliquer sur **Supprimer** sur une paire.
2. Confirmer la suppression.

**Résultat attendu** : La paire disparaît de la liste.

---

### PAIR-04 — Import de paires depuis un fichier XLS

- [ ] **Statut**

**Préconditions** : Fichier XLS valide au format FFT (cf. `docs/example.csv` comme référence de structure). Tournoi non démarré.

**Étapes** :
1. Ouvrir le tournoi → onglet **Joueurs**.
2. Cliquer sur **Importer**.
3. Sélectionner le fichier XLS valide.
4. Valider l'import.

**Résultat attendu** : Les paires sont ajoutées/mises à jour dans la liste. Un toast de succès s'affiche avec le nombre de paires importées.

---

### PAIR-05 — Import avec fichier XLS invalide

- [ ] **Statut**

**Préconditions** : Un fichier XLS avec colonnes manquantes ou format incorrect.

**Étapes** :
1. Tenter d'importer un fichier XLS invalide.

**Résultat attendu** : Message d'erreur clair indiquant les colonnes manquantes ou le problème de format. Aucune paire n'est importée.

---

### PAIR-06 — Badge de saisie incomplète

- [ ] **Statut**

**Préconditions** : Au moins une paire avec un joueur sans ranking ou sans numéro de licence.

**Étapes** :
1. Ajouter une paire avec le Joueur 2 sans ranking.
2. Observer l'onglet **Joueurs**.

**Résultat attendu** : Un badge numérique (ex. « 1 ») apparaît sur l'onglet indiquant le nombre de paires incomplètes.

---

### PAIR-07 — Joueurs verrouillés quand le tournoi est STARTED

- [ ] **Statut**

**Préconditions** : Tournoi en statut STARTED.

**Étapes** :
1. Ouvrir le tournoi → onglet **Joueurs**.
2. Tenter d'ajouter, modifier ou supprimer une paire.

**Résultat attendu** : Les boutons Ajouter/Modifier/Supprimer sont absents ou désactivés. Un message indique que les joueurs sont verrouillés.

---

### PAIR-08 — Matching automatique des classements FFT

- [ ] **Statut**

**Préconditions** : Des rankings FFT sont importés en base (via la commande admin). Une paire a un joueur dont le nom correspond à un joueur FFT.

**Étapes** :
1. Importer des paires (PAIR-04) incluant un joueur dont le classement FFT est disponible.
2. Observer le ranking affiché après import.

**Résultat attendu** : Le ranking du joueur est automatiquement rempli depuis la base FFT si son nom correspond.

---

### PAIR-09 — Contrainte : un joueur ne peut être dans deux paires du même tournoi

- [ ] **Statut**

**Préconditions** : Une paire existe avec `Alice Dupont` (licence `1234567A`).

**Étapes** :
1. Tenter d'ajouter une nouvelle paire avec `Alice Dupont` (même licence `1234567A`) en Joueur 1 ou Joueur 2.

**Résultat attendu** : Message d'erreur indiquant que ce joueur est déjà inscrit dans le tournoi.

---

## 4. Paramètres (onglet Réglages)

### PARAM-01 — Sélection du format de jeu avec auto-remplissage de la durée

- [ ] **Statut**

**Préconditions** : Tournoi ouvert. Session active.

**Étapes** :
1. Ouvrir le tournoi → onglet **Réglages**.
2. Sélectionner le format de jeu `B1`.
3. Observer le champ **Durée estimée d'un match**.

**Résultat attendu** : La durée estimée est automatiquement renseignée avec la valeur par défaut du format `B1`.

---

### PARAM-02 — Saisie manuelle de la durée estimée

- [ ] **Statut**

**Préconditions** : Tournoi ouvert.

**Étapes** :
1. Ouvrir l'onglet **Réglages**.
2. Modifier la durée estimée à `90` minutes.
3. Sauvegarder.

**Résultat attendu** : Toast de succès. La valeur 90 est persistée et réaffichée après rechargement.

---

### PARAM-03 — Ajout d'un créneau horaire

- [ ] **Statut**

**Préconditions** : Tournoi ouvert.

**Étapes** :
1. Onglet **Réglages** → section Créneaux horaires.
2. Cliquer sur **Ajouter un créneau**.
3. Renseigner : Heure début `09:00`, Heure fin `12:00`, Terrains disponibles `4`.
4. Valider.

**Résultat attendu** : Le créneau apparaît dans la liste des créneaux.

---

### PARAM-04 — Modification d'un créneau horaire

- [ ] **Statut**

**Préconditions** : Au moins un créneau créé (PARAM-03).

**Étapes** :
1. Cliquer sur **Modifier** sur le créneau.
2. Changer le nombre de terrains à `6`.
3. Sauvegarder.

**Résultat attendu** : Le créneau affiche désormais 6 terrains.

---

### PARAM-05 — Suppression d'un créneau horaire

- [ ] **Statut**

**Préconditions** : Au moins un créneau créé.

**Étapes** :
1. Cliquer sur **Supprimer** sur le créneau.
2. Confirmer.

**Résultat attendu** : Le créneau disparaît de la liste.

---

### PARAM-06 — Validation des bornes de durée estimée

- [ ] **Statut**

**Préconditions** : Tournoi ouvert.

**Étapes** :
1. Saisir `0` dans le champ durée estimée.
2. Saisir `200` dans le champ durée estimée.
3. Tenter de sauvegarder dans les deux cas.

**Résultat attendu** : Messages d'erreur de validation (valeur comprise entre 1 et 180 minutes).

---

## 5. Tableau / Bracket (onglet Tableau)

> Les scénarios de cette section nécessitent un tournoi en configuration **TMC** avec au minimum **4 paires avec ranking**.

### BRAK-01 — Génération d'un bracket

- [ ] **Statut**

**Préconditions** : Tournoi avec ≥ 4 paires rankées, configuration TMC, statut SET ou READY. Session active.

**Étapes** :
1. Ouvrir l'onglet **Tableau**.
2. Cliquer sur **Générer le tableau**.
3. Sélectionner dimension `8` et répartir les paires sur les tours (ex. : 4 paires au tour 1, 4 en tour 2).
4. Valider.

**Résultat attendu** : L'arbre du bracket s'affiche avec les bons emplacements. Les matchs sont créés.

---

### BRAK-02 — Tirage au sort automatique (Draw)

- [ ] **Statut**

**Préconditions** : Bracket généré (BRAK-01). Paires non encore placées.

**Étapes** :
1. Onglet **Tableau**.
2. Cliquer sur **Tirage au sort** (Draw).
3. Confirmer.

**Résultat attendu** : Toutes les paires sont placées automatiquement dans le bracket. La tête de série 1 (TS1) et la tête de série 2 (TS2) sont placées dans des cases opposées conformément aux règles FFT.

---

### BRAK-03 — Placement manuel d'une paire

- [ ] **Statut**

**Préconditions** : Bracket généré. Au moins un emplacement vide.

**Étapes** :
1. Onglet **Tableau**.
2. Cliquer sur un emplacement vide dans l'arbre.
3. Sélectionner une paire dans la liste proposée.

**Résultat attendu** : La paire est placée dans l'emplacement. L'arbre se met à jour.

---

### BRAK-04 — Suppression du bracket

- [ ] **Statut**

**Préconditions** : Bracket existant. Tournoi non FINISHED.

**Étapes** :
1. Onglet **Tableau**.
2. Cliquer sur **Supprimer le tableau**.
3. Confirmer.

**Résultat attendu** : Le bracket est supprimé. L'onglet Tableau propose de nouveau la génération.

---

### BRAK-05 — Impossible de supprimer un bracket si tournoi FINISHED

- [ ] **Statut**

**Préconditions** : Tournoi en statut FINISHED.

**Étapes** :
1. Tenter de supprimer le bracket via l'interface.

**Résultat attendu** : L'action est bloquée (bouton absent ou erreur).

---

### BRAK-06 — Visualisation de l'arbre de bracket

- [ ] **Statut**

**Préconditions** : Bracket généré avec des paires placées.

**Étapes** :
1. Onglet **Tableau**.
2. Observer l'arbre affiché.

**Résultat attendu** : Les noms des paires sont visibles dans les bonnes cases. La structure pyramidale est correcte (finale en haut/bas, premiers tours aux extrémités).

---

### BRAK-07 — Saisie d'un score dans le bracket

- [ ] **Statut**

**Préconditions** : Bracket avec paires placées. Match en statut UPCOMING ou STARTED.

**Étapes** :
1. Onglet **Tableau**.
2. Cliquer sur un match.
3. Saisir un score (ex. `6/3 6/4`) et sélectionner le vainqueur.
4. Valider.

**Résultat attendu** : Le match passe en FINISHED. Le vainqueur est propagé automatiquement au match suivant dans l'arbre.

---

### BRAK-08 — Suppression d'un score dans le bracket

- [ ] **Statut**

**Préconditions** : Un match a un score enregistré mais le match suivant n'est pas encore scoré.

**Étapes** :
1. Cliquer sur le match scoré dans le bracket.
2. Supprimer le score.

**Résultat attendu** : Le match repasse en UPCOMING. La case du vainqueur dans le match suivant est vidée.

---

## 6. Gestion des matchs (onglet Matchs)

### MATCH-01 — Démarrage d'un match

- [ ] **Statut**

**Préconditions** : Bracket avec paires placées. Au moins un match UPCOMING avec les deux paires renseignées.

**Étapes** :
1. Ouvrir l'onglet **Matchs** → sous-onglet **À venir**.
2. Cliquer sur **Démarrer** sur le premier match.

**Résultat attendu** : Le match passe dans **En cours**. Si c'est le premier match démarré, le statut du tournoi passe à STARTED.

---

### MATCH-02 — Saisie d'un score

- [ ] **Statut**

**Préconditions** : Au moins un match STARTED.

**Étapes** :
1. Onglet **Matchs** → sous-onglet **En cours**.
2. Cliquer sur **Saisir le score** du match.
3. Entrer le score `6/2 6/3` et sélectionner le vainqueur.
4. Valider.

**Résultat attendu** : Le match passe dans **Terminés**. Le vainqueur est propagé au tour suivant.

---

### MATCH-03 — Suppression d'un score (annulation de résultat)

- [ ] **Statut**

**Préconditions** : Match FINISHED dont le match suivant n'a pas encore de score.

**Étapes** :
1. Onglet **Matchs** → sous-onglet **Terminés**.
2. Cliquer sur le match et supprimer le score.

**Résultat attendu** : Le match repasse en UPCOMING (ou STARTED selon l'état). Le vainqueur est retiré du match suivant.

---

### MATCH-04 — Impossible de supprimer le score si le match suivant est déjà scoré

- [ ] **Statut**

**Préconditions** : Un match A est terminé, le match suivant B (auquel le vainqueur de A participe) est également terminé.

**Étapes** :
1. Tenter de supprimer le score du match A.

**Résultat attendu** : L'action est bloquée avec un message explicite.

---

### MATCH-05 — Réordonnancement des matchs par drag-and-drop

- [ ] **Statut**

**Préconditions** : Tournoi en statut STARTED. Au moins 3 matchs UPCOMING.

**Étapes** :
1. Onglet **Matchs** → sous-onglet **À venir**.
2. Glisser-déposer le 3e match en première position.

**Résultat attendu** : L'ordre est mis à jour. Les heures estimées de début se recalculent en conséquence.

---

### MATCH-06 — Affichage de l'heure estimée de début

- [ ] **Statut**

**Préconditions** : Tournoi avec créneaux horaires configurés (PARAM-03) et matchs UPCOMING.

**Étapes** :
1. Onglet **Matchs** → sous-onglet **À venir**.
2. Observer les heures estimées de début affichées sur chaque match.

**Résultat attendu** : Chaque match affiche une heure estimée cohérente avec les créneaux et la durée estimée. Les matchs en parallèle (plusieurs terrains) ont la même heure de début.

---

### MATCH-07 — Propagation automatique du vainqueur

- [ ] **Statut**

**Préconditions** : Bracket 8 avec tirage effectué.

**Étapes** :
1. Scorer le match `M1` (quart de finale).
2. Observer le match de demi-finale qui reçoit le vainqueur de M1.

**Résultat attendu** : La paire gagnante de M1 apparaît automatiquement comme participant au match de demi-finale.

---

### MATCH-08 — Finale : fin automatique du tournoi

- [ ] **Statut**

**Préconditions** : Tournoi à l'état STARTED. Tous les matchs sont terminés sauf la finale.

**Étapes** :
1. Scorer la finale du bracket principal.

**Résultat attendu** : Le tournoi passe automatiquement au statut FINISHED.

---

## 7. Tableaux de classement

### CLASS-01 — Affichage des brackets de classement

- [ ] **Statut**

**Préconditions** : Bracket principal généré avec une dimension ≥ 8 (des brackets de classement sont auto-générés).

**Étapes** :
1. Ouvrir l'onglet **Tableaux de classement**.
2. Sélectionner un bracket dans le menu déroulant (ex. « Places 5-8 »).

**Résultat attendu** : L'arbre du bracket de classement s'affiche. Les perdants du tour correspondant apparaissent dans les emplacements.

---

### CLASS-02 — Saisie d'un score dans un bracket de classement

- [ ] **Statut**

**Préconditions** : Bracket de classement affiché avec des paires. Le match de classement correspondant a ses deux paires connues.

**Étapes** :
1. Onglet **Tableaux de classement**.
2. Cliquer sur un match dans le bracket de classement.
3. Saisir un score et sélectionner le vainqueur.
4. Valider.

**Résultat attendu** : Le score est enregistré. Le vainqueur est propagé au tour suivant du bracket de classement.

---

### CLASS-03 — Suppression d'un score de classement

- [ ] **Statut**

**Préconditions** : Un match de classement a un score. Le match suivant dans ce bracket n'est pas encore scoré.

**Étapes** :
1. Supprimer le score du match de classement.

**Résultat attendu** : Le score est supprimé. Le bracket se met à jour.

---

### CLASS-04 — Impression du tableau de classement

- [ ] **Statut**

**Préconditions** : Bracket de classement affiché.

**Étapes** :
1. Cliquer sur le bouton **Imprimer**.

**Résultat attendu** : La fenêtre d'impression du navigateur s'ouvre avec une vue adaptée à l'impression du bracket de classement.

---

## 8. Accès public

### PUB-01 — Accès via le lien public sans authentification

- [ ] **Statut**

**Préconditions** : Tournoi créé. Lien public copié (TOUR-06). Navigateur sans session.

**Étapes** :
1. Ouvrir une session de navigation privée (sans cookie de session).
2. Naviguer vers le lien public du tournoi (ex. `/public/tournaments/<code>`).

**Résultat attendu** : La page publique du tournoi s'affiche sans demander de connexion.

---

### PUB-02 — Contenu de la page publique (onglets)

- [ ] **Statut**

**Préconditions** : Tournoi avec paires, bracket et matchs.

**Étapes** :
1. Depuis la page publique, naviguer dans chaque onglet : **Info**, **Joueurs**, **Matchs**, **Tableau**, **Tableaux de classement**.

**Résultat attendu** :
- **Info** : Informations générales du tournoi (nom, catégorie, date, lieu, statut).
- **Joueurs** : Liste des paires inscrites (sans données sensibles PII non publiques).
- **Matchs** : Matchs classés par statut (À venir, En cours, Terminés).
- **Tableau** : Arbre du bracket (si généré).
- **Tableaux de classement** : Brackets de classement (si existants).

---

### PUB-03 — Lecture seule : aucun bouton d'édition

- [ ] **Statut**

**Préconditions** : Accès à la page publique.

**Étapes** :
1. Observer chaque onglet de la page publique.

**Résultat attendu** : Aucun bouton Ajouter / Modifier / Supprimer / Démarrer n'est présent. La page est strictement en lecture seule.

---

### PUB-04 — Mise à jour en temps réel via WebSocket

- [ ] **Statut**

**Préconditions** : Un onglet navigateur est ouvert sur la page publique. Un second onglet est ouvert sur la page de gestion du tournoi (authentifié).

**Étapes** :
1. Dans l'onglet de gestion, démarrer un match.
2. Observer l'onglet de la page publique sans la recharger.
3. Dans l'onglet de gestion, saisir un score.
4. Observer l'onglet de la page publique.

**Résultat attendu** :
- Étape 2 : La page publique se met à jour automatiquement (le match passe en « En cours »).
- Étape 4 : Le score et le statut du match se mettent à jour automatiquement.

---

### PUB-05 — Reconnexion WebSocket après coupure réseau

- [ ] **Statut**

**Préconditions** : Page publique ouverte et WebSocket connecté.

**Étapes** :
1. Désactiver brièvement la connexion réseau (ou simuler via DevTools → Network → Offline).
2. Réactiver la connexion.
3. Effectuer une modification sur le tournoi depuis l'onglet de gestion.

**Résultat attendu** : La page publique se reconnecte automatiquement (sans recharger la page manuellement) et reflète la mise à jour.

---

### PUB-06 — Accès public avec code invalide

- [ ] **Statut**

**Préconditions** : Aucune.

**Étapes** :
1. Naviguer vers `/public/tournaments/codeinvalide`.

**Résultat attendu** : Page d'erreur 404 ou message indiquant que le tournoi est introuvable.

---

## 9. Outil Tirage au sort

### DRAW-01 — Accès et utilisation de base

- [ ] **Statut**

**Préconditions** : Session active (l'outil est protégé par l'AuthGuard).

**Étapes** :
1. Naviguer vers `/draw`.
2. Sélectionner `8` éléments à tirer.
3. Cliquer sur **Mélanger**.
4. Révéler les numéros un par un.

**Résultat attendu** : Les 8 numéros s'affichent dans un ordre aléatoire, révélés un à un. Aucun doublon.

---

### DRAW-02 — Réinitialisation du tirage

- [ ] **Statut**

**Préconditions** : Un tirage a été effectué (DRAW-01).

**Étapes** :
1. Cliquer sur **Réinitialiser** (ou **Nouveau tirage**).

**Résultat attendu** : La page revient à son état initial. Un nouveau tirage peut être effectué.

---

### DRAW-03 — Changement du nombre d'éléments

- [ ] **Statut**

**Préconditions** : Page `/draw` ouverte.

**Étapes** :
1. Sélectionner `2` éléments puis tirer.
2. Sélectionner `16` éléments puis tirer.

**Résultat attendu** : Le tirage respecte la quantité sélectionnée (2 ou 16 numéros, sans doublon dans chaque cas).

---

## 10. Cas limites, sécurité et UX

### EDGE-01 — Responsive mobile (390 px)

- [ ] **Statut**

**Préconditions** : Aucune. Tester avec les DevTools du navigateur en mode mobile (iPhone 14 Pro, 390px).

**Étapes** :
1. Naviguer sur `/home`, `/auth/login`, `/auth/register`.
2. Ouvrir un tournoi et parcourir chaque onglet (Infos, Joueurs, Réglages, Tableau, Matchs).
3. Tester la page publique.

**Résultat attendu** : Toutes les pages sont lisibles et utilisables sur 390px. Aucun overflow horizontal. Les boutons et liens ont une zone cliquable d'au moins 48px.

---

### EDGE-02 — Formulaires avec champs vides

- [ ] **Statut**

**Préconditions** : Aucune.

**Étapes** :
1. Tenter de soumettre le formulaire de connexion vide.
2. Tenter de créer un tournoi sans nom.
3. Tenter d'ajouter une paire sans nom pour le Joueur 1.

**Résultat attendu** : Les validations côté client bloquent la soumission et affichent des messages d'erreur sur les champs concernés.

---

### EDGE-03 — Affichage des toasts d'erreur serveur

- [ ] **Statut**

**Préconditions** : Session active.

**Étapes** :
1. Couper l'accès au backend (simuler via DevTools → Network → Block request).
2. Tenter de charger la liste des tournois ou de créer un tournoi.

**Résultat attendu** : Un toast d'erreur s'affiche indiquant une erreur réseau. L'application ne plante pas (pas d'écran blanc).

---

### EDGE-04 — Expiration du token JWT

- [ ] **Statut**

**Préconditions** : Session active. Accès aux DevTools pour supprimer le token.

**Étapes** :
1. Supprimer manuellement le `access_token` du `localStorage` (DevTools → Application → Local Storage).
2. Effectuer une action nécessitant une authentification (ex. charger la liste des tournois).

**Résultat attendu** : L'utilisateur est redirigé vers `/auth/login`.

---

### EDGE-05 — Navigation page de chargement SSR

- [ ] **Statut**

**Préconditions** : Accès à l'application depuis un premier chargement (SSR).

**Étapes** :
1. Ouvrir l'application en mode navigation normale (premier chargement depuis serveur).
2. Observer la transition entre le rendu serveur et le rendu client.

**Résultat attendu** : Pas de saut visuel (flash) notable. La page `/loading` ne s'affiche que brièvement si elle est utilisée comme bridge SSR.

---

### EDGE-06 — Pagination de la liste des tournois

- [ ] **Statut**

**Préconditions** : Plus de 10 tournois créés pour l'utilisateur.

**Étapes** :
1. Naviguer vers `/home`.
2. Observer la pagination.
3. Aller à la page 2.

**Résultat attendu** : 10 tournois par page. La page 2 affiche les tournois suivants. La navigation entre pages fonctionne correctement.

---

### EDGE-07 — Statut du tournoi évolue automatiquement vers SET

- [ ] **Statut**

**Préconditions** : Tournoi en DRAFT avec un format de jeu configuré.

**Étapes** :
1. Ajouter au moins 4 paires avec ranking.
2. Observer le badge de statut dans l'onglet Infos.

**Résultat attendu** : Le statut passe automatiquement à SET sans action manuelle supplémentaire.

---

### EDGE-08 — Impossible de modifier un tournoi FINISHED

- [ ] **Statut**

**Préconditions** : Tournoi en statut FINISHED.

**Étapes** :
1. Tenter de modifier les informations du tournoi (onglet Infos).
2. Tenter de modifier les paramètres (onglet Réglages).

**Résultat attendu** : Les formulaires sont en lecture seule ou désactivés. Aucune modification n'est possible.

---

## 11. Automatisation des tests (agent IA en CI)

### Stratégie globale

L'objectif est d'exécuter automatiquement l'ensemble des scénarios fonctionnels à chaque commit via un agent IA piloté par **Playwright**, et d'identifier sans ambiguïté les scénarios qui doivent toujours être validés par un humain.

```
Commit / PR
    │
    ▼
GitHub Actions (CI)
    ├── Backend Django  →  base de données de test isolée + Mailpit (email)
    ├── Frontend Angular  →  ng serve en mode test
    └── Agent Playwright  →  exécute les specs e2e
            │
            ├── ✅ Tests AUTO passent  →  merge autorisé
            └── ❌ Régression détectée  →  PR bloquée + rapport de test
```

Les scénarios non couverts par l'automatisation sont regroupés dans la **liste MANUEL** ci-dessous et doivent être rejoués à la main avant chaque mise en production.

---

### Outillage recommandé

| Outil | Rôle |
|---|---|
| **Playwright** | Pilotage navigateur, assertions DOM, gestion multi-onglets |
| **GitHub Actions** | Exécution CI à chaque commit/PR |
| **Mailpit** | Serveur SMTP de test pour intercepter les emails de reset de mot de passe |
| **Fixtures Django** | Données de test reproductibles (comptes, tournois, paires, classements FFT) |
| **Playwright API** | `request` context pour pré-créer des données via l'API sans passer par l'UI |

---

### Structure des fichiers de tests

```
e2e/
├── fixtures/
│   ├── auth.ts          # helpers login/logout réutilisables
│   ├── tournament.ts    # helpers création d'un tournoi avec paires et bracket
│   └── data.ts          # constantes (emails de test, noms, rankings)
├── pages/               # Page Object Model
│   ├── LoginPage.ts
│   ├── TournamentSetupPage.ts
│   └── PublicTournamentPage.ts
├── specs/
│   ├── auth.spec.ts
│   ├── tournaments.spec.ts
│   ├── pairs.spec.ts
│   ├── settings.spec.ts
│   ├── bracket.spec.ts
│   ├── matches.spec.ts
│   ├── classification.spec.ts
│   ├── public.spec.ts
│   ├── draw.spec.ts
│   └── edge-cases.spec.ts
├── playwright.config.ts
└── global-setup.ts      # réinitialisation de la base de test avant chaque run
```

**Conventions importantes :**
- Chaque spec est indépendante : elle crée ses propres données via l'API avant de tester l'UI.
- La base de données est remise à zéro (`flush` + fixtures) avant chaque run complet.
- Les tests s'exécutent avec deux contextes navigateur distincts lorsque plusieurs utilisateurs sont nécessaires (ex. PUB-04).

---

### Classification des scénarios : AUTO vs MANUEL

#### Légende

| Symbole | Signification |
|---|---|
| 🤖 AUTO | Entièrement automatisable par un agent Playwright en CI |
| ⚠️ PARTIEL | Automatisable pour la logique fonctionnelle, mais la vérification visuelle reste manuelle |
| 🧑 MANUEL | Toujours à tester manuellement (raison détaillée dans la section suivante) |

#### Tableau de classification

| ID | Titre | Mode |
|---|---|---|
| AUTH-01 | Inscription d'un nouvel utilisateur | 🤖 AUTO |
| AUTH-02 | Inscription avec email déjà utilisé | 🤖 AUTO |
| AUTH-03 | Inscription avec mots de passe non concordants | 🤖 AUTO |
| AUTH-04 | Connexion valide | 🤖 AUTO |
| AUTH-05 | Connexion avec mauvais mot de passe | 🤖 AUTO |
| AUTH-06 | Déconnexion | 🤖 AUTO |
| AUTH-07 | Accès à une page protégée sans connexion | 🤖 AUTO |
| AUTH-08 | Accès aux pages d'auth avec session active | 🤖 AUTO |
| AUTH-09 | Réinitialisation du mot de passe (flux complet) | 🤖 AUTO (avec Mailpit) |
| AUTH-10 | Réinitialisation avec token invalide | 🤖 AUTO |
| AUTH-11 | Consultation du profil utilisateur | 🤖 AUTO |
| AUTH-12 | Changement de mot de passe (profil) | 🤖 AUTO |
| AUTH-13 | Changement avec mauvais ancien mot de passe | 🤖 AUTO |
| TOUR-01 | Création d'un tournoi | 🤖 AUTO |
| TOUR-02 | Affichage de la liste des tournois | 🤖 AUTO |
| TOUR-03 | Filtres sur la liste des tournois | 🤖 AUTO |
| TOUR-04 | Modification des informations | 🤖 AUTO |
| TOUR-05 | Statut DRAFT affiché | 🤖 AUTO |
| TOUR-06 | QR code et copie du lien public | ⚠️ PARTIEL |
| TOUR-07 | Suppression d'un tournoi | 🤖 AUTO |
| TOUR-08 | Impossible de supprimer un tournoi STARTED/FINISHED | 🤖 AUTO |
| TOUR-09 | Accès au tournoi d'un autre utilisateur | 🤖 AUTO |
| PAIR-01 | Ajout manuel d'une paire | 🤖 AUTO |
| PAIR-02 | Modification d'une paire | 🤖 AUTO |
| PAIR-03 | Suppression d'une paire | 🤖 AUTO |
| PAIR-04 | Import de paires depuis un fichier XLS | 🤖 AUTO |
| PAIR-05 | Import avec fichier XLS invalide | 🤖 AUTO |
| PAIR-06 | Badge de saisie incomplète | 🤖 AUTO |
| PAIR-07 | Joueurs verrouillés quand STARTED | 🤖 AUTO |
| PAIR-08 | Matching automatique des classements FFT | 🧑 MANUEL |
| PAIR-09 | Contrainte joueur dans deux paires | 🤖 AUTO |
| PARAM-01 | Format de jeu avec auto-remplissage de la durée | 🤖 AUTO |
| PARAM-02 | Saisie manuelle de la durée | 🤖 AUTO |
| PARAM-03 | Ajout d'un créneau horaire | 🤖 AUTO |
| PARAM-04 | Modification d'un créneau horaire | 🤖 AUTO |
| PARAM-05 | Suppression d'un créneau horaire | 🤖 AUTO |
| PARAM-06 | Validation des bornes de durée | 🤖 AUTO |
| BRAK-01 | Génération d'un bracket | 🤖 AUTO |
| BRAK-02 | Tirage au sort automatique (Draw) | 🤖 AUTO |
| BRAK-03 | Placement manuel d'une paire | 🤖 AUTO |
| BRAK-04 | Suppression du bracket | 🤖 AUTO |
| BRAK-05 | Impossible de supprimer si FINISHED | 🤖 AUTO |
| BRAK-06 | Visualisation de l'arbre de bracket | ⚠️ PARTIEL |
| BRAK-07 | Saisie d'un score dans le bracket | 🤖 AUTO |
| BRAK-08 | Suppression d'un score dans le bracket | 🤖 AUTO |
| MATCH-01 | Démarrage d'un match | 🤖 AUTO |
| MATCH-02 | Saisie d'un score | 🤖 AUTO |
| MATCH-03 | Suppression d'un score | 🤖 AUTO |
| MATCH-04 | Impossible de supprimer si match suivant scoré | 🤖 AUTO |
| MATCH-05 | Réordonnancement par drag-and-drop | ⚠️ PARTIEL |
| MATCH-06 | Affichage de l'heure estimée de début | 🤖 AUTO |
| MATCH-07 | Propagation automatique du vainqueur | 🤖 AUTO |
| MATCH-08 | Finale : fin automatique du tournoi | 🤖 AUTO |
| CLASS-01 | Affichage des brackets de classement | 🤖 AUTO |
| CLASS-02 | Saisie d'un score de classement | 🤖 AUTO |
| CLASS-03 | Suppression d'un score de classement | 🤖 AUTO |
| CLASS-04 | Impression du tableau de classement | 🧑 MANUEL |
| PUB-01 | Accès public sans authentification | 🤖 AUTO |
| PUB-02 | Contenu des onglets de la page publique | 🤖 AUTO |
| PUB-03 | Lecture seule : aucun bouton d'édition | 🤖 AUTO |
| PUB-04 | Mise à jour en temps réel via WebSocket | 🤖 AUTO |
| PUB-05 | Reconnexion WebSocket après coupure réseau | 🧑 MANUEL |
| PUB-06 | Accès public avec code invalide | 🤖 AUTO |
| DRAW-01 | Accès et utilisation de base | 🤖 AUTO |
| DRAW-02 | Réinitialisation du tirage | 🤖 AUTO |
| DRAW-03 | Changement du nombre d'éléments | 🤖 AUTO |
| EDGE-01 | Responsive mobile (390 px) | ⚠️ PARTIEL |
| EDGE-02 | Formulaires avec champs vides | 🤖 AUTO |
| EDGE-03 | Affichage des toasts d'erreur serveur | 🤖 AUTO |
| EDGE-04 | Expiration du token JWT | 🤖 AUTO |
| EDGE-05 | Navigation page de chargement SSR | 🧑 MANUEL |
| EDGE-06 | Pagination de la liste des tournois | 🤖 AUTO |
| EDGE-07 | Statut du tournoi évolue vers SET | 🤖 AUTO |
| EDGE-08 | Impossible de modifier un tournoi FINISHED | 🤖 AUTO |

**Résumé** : 63 🤖 AUTO — 4 ⚠️ PARTIEL — 4 🧑 MANUEL

---

### Scénarios à toujours tester manuellement

Ces 4 scénarios ne peuvent pas être couverts de manière fiable par un agent en CI. Ils doivent être rejoués **avant chaque mise en production**.

#### 🧑 PAIR-08 — Matching automatique des classements FFT

**Raison** : Ce test dépend d'un import préalable de fichiers PDF officiels de la FFT via une commande Django (`manage.py import_fft_rankings`). Cette opération implique des fichiers externes non versionnés, un format propriétaire, et une correspondance par nom qui nécessite un contrôle humain pour valider la pertinence des matchs (homonymes, accents, noms composés).

**Ce qu'il faut vérifier à la main** : Importer un fichier de classement FFT réel, ajouter des paires dont un joueur figure dans ce classement, et vérifier que son ranking est correctement rempli.

---

#### 🧑 CLASS-04 — Impression du tableau de classement

**Raison** : Playwright ne peut pas interagir avec la boîte de dialogue d'impression native du navigateur. L'automatisation peut uniquement vérifier que le bouton déclenche `window.print()`, mais elle ne peut pas valider la mise en page imprimée (pagination, lisibilité, absence de troncature).

**Ce qu'il faut vérifier à la main** : Ouvrir la prévisualisation d'impression et s'assurer que le tableau tient sur une page A4, que les noms de paires sont lisibles et que les scores apparaissent correctement.

---

#### 🧑 PUB-05 — Reconnexion WebSocket après coupure réseau

**Raison** : Simuler une vraie coupure réseau de manière fiable en CI est fragile. Playwright expose `page.route()` pour bloquer des requêtes HTTP mais pas les connexions WebSocket de bas niveau. Les solutions de contournement (mock du WebSocket, `page.context().setOffline()`) ne reproduisent pas fidèlement le comportement de reconnexion avec backoff exponentiel observé en production.

**Ce qu'il faut vérifier à la main** : Ouvrir la page publique, activer le mode avion ou couper le Wi-Fi pendant 5 secondes, le réactiver, puis confirmer que les données se remettent à jour sans rechargement.

---

#### 🧑 EDGE-05 — Navigation page de chargement SSR

**Raison** : Le rendu SSR implique une transition entre le HTML généré côté serveur et l'hydratation Angular côté client. Détecter un flash visuel ou un saut de mise en page (layout shift) requiert un œil humain : les métriques automatiques (CLS via Lighthouse) peuvent le capturer partiellement mais ne reflètent pas l'expérience perçue.

**Ce qu'il faut vérifier à la main** : Effectuer un premier chargement sur la production (cache froid, DevTools → Network → Disable cache), observer qu'aucun contenu ne saute ou ne disparaît brièvement pendant l'hydratation.

---

### Notes sur les scénarios PARTIELS

Ces scénarios sont automatisés pour leur logique fonctionnelle mais nécessitent une vérification visuelle occasionnelle (à chaque évolution de la mise en page, pas à chaque commit).

| ID | Ce qui est automatisé | Ce qui reste manuel |
|---|---|---|
| **TOUR-06** | Vérification que le QR code est présent dans le DOM et que le clic sur "Copier" déclenche l'action | Scanner physiquement le QR code avec un smartphone pour valider qu'il pointe vers la bonne URL |
| **BRAK-06** | Vérification que les noms de paires sont affichés dans les bons sélecteurs CSS de l'arbre | Contrôle visuel de la lisibilité de l'arbre pour une dimension 32 ou 64 (arbre très large) |
| **MATCH-05** | Vérification que l'ordre des matchs change après le drag-and-drop (via Playwright `dragTo`) | Contrôle visuel que le feedback de drag est fluide et ne désoriente pas l'utilisateur |
| **EDGE-01** | Vérification de l'absence d'overflow horizontal à 390px via `page.setViewportSize` | Contrôle visuel sur un vrai appareil mobile (typographies, espacements, zones de tap) |

---

### Configuration CI recommandée (GitHub Actions)

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_DB: jap_test
          POSTGRES_USER: jap
          POSTGRES_PASSWORD: jap
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7
      mailpit:
        image: axllent/mailpit
        ports:
          - 8025:8025   # UI
          - 1025:1025   # SMTP

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python & Django backend
        run: |
          pip install -r requirements.txt
          python manage.py migrate --settings=config.settings.test
          python manage.py loaddata fixtures/test_fft_rankings.json
          python manage.py runserver 8000 &

      - name: Setup Node & Angular frontend
        run: |
          npm ci
          npm run build -- --configuration=test
          npx serve -s dist/jap-assistant-web -p 4200 &

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Récapitulatif

| Domaine | Nb scénarios | Validés | Défauts |
|---|---|---|---|
| Authentification (AUTH) | 13 | | |
| Tournois (TOUR) | 9 | | |
| Paires (PAIR) | 9 | | |
| Paramètres (PARAM) | 6 | | |
| Bracket / Tableau (BRAK) | 8 | | |
| Matchs (MATCH) | 8 | | |
| Classement (CLASS) | 4 | | |
| Accès public (PUB) | 6 | | |
| Tirage au sort (DRAW) | 3 | | |
| Cas limites (EDGE) | 8 | | |
| **TOTAL** | **74** | | |

| Mode | Nb scénarios |
|---|---|
| 🤖 Automatisés (Playwright CI) | 63 |
| ⚠️ Partiels (logique auto, visuel manuel) | 4 |
| 🧑 Toujours manuels | 4 |
