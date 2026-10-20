// UI copy only: member names, restaurant data and form values are never translated.
(() => {
  const copy = {
    'Change member access':'Toegang van lid wijzigen',
    'Deactivate':'Deactiveren', 'Reactivate':'Heractiveren', 'Deactivated':'Gedeactiveerd',
    'Deactivating member…':'Lid deactiveren…', 'Reactivating member…':'Lid heractiveren…',
    'Member deactivated. Their ratings are preserved.':'Lid gedeactiveerd. De beoordelingen blijven bewaard.',
    'Member reactivated. Their group access is restored.':'Lid geheractiveerd. De toegang tot de groep is hersteld.',
    'This member is deactivated. Use Reactivate to restore access.':'Dit lid is gedeactiveerd. Gebruik Heractiveren om de toegang te herstellen.',
    'Deactivate this member? They will lose group access. Their ratings will be preserved.':'Dit lid deactiveren? Het lid verliest toegang tot de groep. De beoordelingen blijven bewaard.',
    'Reactivate this member and restore their group access?':'Dit lid heractiveren en toegang tot de groep herstellen?',
    'The account status could not be changed. Try again.':'De accountstatus kon niet worden gewijzigd. Probeer opnieuw.',
    'You cannot deactivate your own account.':'Je kunt je eigen account niet deactiveren.', 'Group owners cannot be deactivated.':'Groepseigenaars kunnen niet worden gedeactiveerd.',
    'The membership changed. Refresh and try again.':'Het lidmaatschap is gewijzigd. Vernieuw en probeer opnieuw.',
    'Cancel':'Annuleren', 'Change name':'Naam aanpassen', 'Change your name':'Pas je naam aan', 'Save name':'Naam opslaan',
    'This name appears next to your ratings.':'Deze naam verschijnt bij je beoordelingen.', 'Saving your name…':'Je naam opslaan…',
    'Enter a name between 1 and 80 characters.':'Vul een naam van 1 tot 80 tekens in.', 'Your name could not be saved. Try again.':'Je naam kon niet worden opgeslagen. Probeer opnieuw.',
    'Move map pin':'Kaartpin verplaatsen', 'Location selected from search':'Locatie gekozen via zoeken',
    'Pin selected. You can move it on the map.':'Kaartpin gekozen. Je kunt hem op de kaart verplaatsen.',
    'Choose a valid date that is not in the future.':'Kies een geldige datum die niet in de toekomst ligt.',
    'Location search is unavailable. Enter an address and choose a spot on the map.':'Locaties zoeken is niet beschikbaar. Vul een adres in en kies een plek op de kaart.',
    'Rating overview':'Ratingoverzicht', 'Every plate,':'Elk bord,', 'around the table.':'samen aan tafel.',
    'Explore the ratings and favourite places shared by your group.':'Ontdek de beoordelingen en favoriete plekken van je groep.',
    'Group rating summary':'Overzicht van de groepsbeoordelingen', 'Group spaghetti map':'Spaghettikaart van de groep',
    'Map of Belgium showing group spaghetti ratings':'Kaart van België met spaghettibeoordelingen van de groep',
    'Select a marker to see the ratings for that restaurant. Ratings without a location are listed above.':'Selecteer een pin om de beoordelingen van dat restaurant te zien. Beoordelingen zonder locatie staan hierboven.',
    'No ratings yet.':'Nog geen beoordelingen.', 'Could not load group ratings. Reload and try again.':'De groepsbeoordelingen konden niet worden geladen. Vernieuw en probeer opnieuw.',
    'The map could not load. You can still browse the ratings above.':'De kaart kon niet worden geladen. Je kunt de beoordelingen hierboven nog bekijken.',
    'Manage members':'Leden beheren', 'Home':'Hoofdpagina', 'Your people,':'Jouw mensen,', 'at the same table.':'aan dezelfde tafel.',
    'Invite friends to rate and remember great spaghetti together.':'Nodig vrienden uit om samen lekkere spaghetti te beoordelen en te onthouden.',
    'Back to ratings':'Terug naar beoordelingen', 'Checking your access…':'Je toegang controleren…',
    'MAKE ROOM AT THE TABLE':'MAAK PLAATS AAN TAFEL', 'Add a member':'Voeg een lid toe', 'Add member':'Lid toevoegen',
    'New members receive an email to set their own password. Existing accounts keep their password.':'Nieuwe leden ontvangen een e-mail om zelf een wachtwoord in te stellen. Bestaande accounts behouden hun wachtwoord.',
    'Display name':'Weergavenaam', 'optional':'optioneel', 'How should we call them?':'Hoe mogen we hen noemen?',
    'YOUR SPAGHETTI CLUB':'JOUW SPAGHETTICLUB', 'Around the table':'Samen aan tafel', 'Refresh':'Vernieuwen',
    'Loading members…':'Leden laden…', 'Owner':'Eigenaar', 'Member':'Lid', 'Account active':'Account actief',
    'Waiting for account activation':'Wacht op accountactivatie', 'Resend invitation':'Uitnodiging opnieuw sturen',
    'Sending invitation…':'Uitnodiging versturen…', 'Adding member…':'Lid toevoegen…',
    'Invitation sent. They can choose a password using the email link.':'Uitnodiging verstuurd. Via de link in de e-mail kunnen ze een wachtwoord kiezen.',
    'This person is already a member. Their access is ready.':'Deze persoon is al lid en heeft toegang tot de groep.',
    'Existing account added. They can sign in with their own password.':'Bestaand account toegevoegd. Aanmelden kan met het eigen wachtwoord.',
    'Group access is ready. Use Resend invitation to send a fresh activation email.':'De groepstoegang is klaar. Stuur de uitnodiging opnieuw om een nieuwe activatiemail te versturen.',
    'Member added.':'Lid toegevoegd.', 'The app could not connect. Reload and try again.':'De app kon geen verbinding maken. Herlaad de pagina en probeer opnieuw.',
    'Sign out failed. Try again.':'Afmelden mislukt. Probeer opnieuw.',
    'Sign in as a group owner first.':'Meld je eerst aan als groepseigenaar.', 'Your session expired. Sign in again.':'Je sessie is verlopen. Meld je opnieuw aan.',
    'Could not verify group permissions.':'De groepsrechten konden niet worden gecontroleerd.', 'Only a group owner can invite members.':'Alleen een groepseigenaar kan leden uitnodigen.',
    'Could not check invitation limits. Try again later.':'De uitnodigingslimiet kon niet worden gecontroleerd. Probeer later opnieuw.',
    'You have sent too many invitations. Try again in an hour.':'Je hebt te veel uitnodigingen verstuurd. Probeer het over een uur opnieuw.',
    'Enter a valid email address and group.':'Voer een geldig e-mailadres en een geldige groep in.',
    'Could not look up member accounts. Try again.':'De ledenaccounts konden niet worden opgezocht. Probeer opnieuw.',
    'Could not load members. Try again.':'De leden konden niet worden geladen. Probeer opnieuw.',
    'The invitation could not be sent. Check the email address and try again.':'De uitnodiging kon niet worden verstuurd. Controleer het e-mailadres en probeer opnieuw.',
    'Could not verify group membership. Try again.':'Het groepslidmaatschap kon niet worden gecontroleerd. Probeer opnieuw.',
    'The account exists, but group access could not be added. Retry to finish adding this member.':'Het account bestaat, maar de groepstoegang kon niet worden toegevoegd. Probeer opnieuw om dit lid toe te voegen.',
    'Group access is ready, but the invitation email could not be sent. Try resending it.':'De groepstoegang is klaar, maar de uitnodigingsmail kon niet worden verstuurd. Probeer de mail opnieuw te sturen.',
    'Could not complete this request. Try again.':'Dit verzoek kon niet worden uitgevoerd. Probeer opnieuw.', 'Invalid request.':'Ongeldig verzoek.',
    'SHARED SPAGHETTI CLUB':'GEDEELDE SPAGHETTICLUB',
    'Sign in':'Aanmelden', 'Only invited members can access shared ratings.':'Alleen uitgenodigde leden hebben toegang tot gedeelde beoordelingen.',
    'THE SEARCH FOR A PERFECT PLATE':'OP ZOEK NAAR HET PERFECTE BORD',
    'Good spaghetti':'Goede spaghetti', 'is worth remembering.':'is het onthouden waard.',
    'Rate the bolognaise, remember the place, and find your Belgian favourite.':'Beoordeel de bolognaise, onthoud het restaurant en vind je Belgische favoriet.',
    'Your rating summary':'Overzicht van je beoordelingen', 'plates rated':'borden beoordeeld', 'average score':'gemiddelde score',
    'YOUR TASTING NOTES':'JE PROEFNOTITIES', 'Rate a plate':'Beoordeel een bord',
    'Restaurant':'Restaurant', 'Where did you eat?':'Waar heb je gegeten?', 'Date':'Datum',
    'Restaurant location':'Locatie van het restaurant', 'optional · search for a place or enter a town':'optioneel · zoek een plek of voer een gemeente in',
    'Restaurant name, street, or town':'Restaurantnaam, straat of gemeente', 'Place suggestions':'Locatiesuggesties',
    'Choose a suggestion to set the map pin automatically.':'Kies een suggestie om de kaartpin automatisch te plaatsen.',
    'Choose spot on map':'Kies een plek op de kaart', 'No map pin selected':'Geen kaartpin geselecteerd',
    'Give each one a score':'Geef elk onderdeel een score', '1 = needs work · 5 = excellent':'1 = kan beter · 5 = uitstekend',
    'Sauce':'Saus', 'Pasta texture':'Textuur van de pasta', 'Texture':'Textuur', 'Portion':'Portie',
    'Sauce rating':'Score voor de saus', 'Pasta texture rating':'Score voor de pastatextuur', 'Portion rating':'Score voor de portie',
    'The little extras':'De kleine extra’s', 'Enough cheese':'Voldoende kaas', 'Hot sauce':'Pikante saus', 'Gratinated':'Gegratineerd', 'Great location':'Mooie locatie', 'Warm hospitality':'Hartelijke ontvangst',
    'Save this plate':'Bewaar dit bord', 'Cancel editing':'Bewerken annuleren', 'Ratings are shared with your group.':'Beoordelingen worden gedeeld met je groep.',
    'YOUR PERSONAL GUIDE':'JE PERSOONLIJKE GIDS', 'Rated & remembered':'Beoordeeld & onthouden',
    'WHERE THE GOOD PLATES ARE':'WAAR JE LEKKERE SPAGHETTI VINDT', 'Your spaghetti map':'Je spaghettikaart',
    'Choose “Choose spot on map” while adding a rating, then tap the map to place its pin. You can zoom and drag to find the restaurant.':'Klik tijdens het toevoegen op “Kies een plek op de kaart” en tik op de kaart om een pin te plaatsen. Je kunt zoomen en slepen om het restaurant te vinden.',
    'Map of Belgium showing your spaghetti ratings':'Kaart van België met je spaghettibeoordelingen',
    'Zoom in':'Inzoomen', 'Zoom out':'Uitzoomen', 'Marker':'Kaartpin', 'Close popup':'Pop-up sluiten',
    'Map data ©':'Kaartgegevens ©', 'OpenStreetMap contributors':'OpenStreetMap-bijdragers',
    'MADE FOR THE LOVE OF A GOOD BOLOGNAISE':'GEMAAKT UIT LIEFDE VOOR EEN GOEDE BOLOGNAISE', 'Belgium · one plate at a time':'België · bord voor bord',
    'Beste Belgische Bolognaise home':'Beste Belgische Bolognaise startpagina',
    'Account':'Account', 'Language':'Taal', 'Invite a friend':'Nodig een vriend uit', 'Change password':'Wachtwoord wijzigen', 'Sign out':'Afmelden',
    'Email':'E-mail', 'Password':'Wachtwoord', 'Forgot password?':'Wachtwoord vergeten?', 'Invite':'Uitnodigen',
    'Choose a password':'Kies een wachtwoord', 'Set new password':'Nieuw wachtwoord instellen', 'Activate account':'Account activeren',
    'Saving your password…':'Je wachtwoord wordt opgeslagen…', 'Password updated. Signing you in…':'Wachtwoord bijgewerkt. Je wordt aangemeld…',
    'Loading shared ratings…':'Gedeelde beoordelingen laden…', 'Choose all three scores first.':'Kies eerst alle drie de scores.',
    'This account is not in this group. Ask the owner for an invitation.':'Dit account is geen lid van deze groep. Vraag de eigenaar om een uitnodiging.',
    'Saving…':'Opslaan…', 'Rating saved and shared.':'Beoordeling opgeslagen en gedeeld.',
    'That reset link expired or was already used. Enter your email and request a new link.':'Deze herstellink is verlopen of al gebruikt. Voer je e-mailadres in en vraag een nieuwe link aan.',
    'Enter your email above first.':'Voer hierboven eerst je e-mailadres in.', 'Sending password reset email…':'E-mail voor wachtwoordherstel versturen…',
    'Password reset email sent. Check your inbox and open the newest link.':'E-mail voor wachtwoordherstel verstuurd. Controleer je inbox en open de nieuwste link.',
    'Invitation sent.':'Uitnodiging verstuurd.', 'View this rating':'Bekijk deze rating', 'Show on map':'Toon op de kaart', 'Edit':'Bewerken', 'Remove':'Verwijderen',
    'Your first plate awaits.':'Je eerste bord wacht op je.', 'Show less':'Toon minder', 'Remove rating?':'Beoordeling verwijderen?',
    'Edit your rating':'Bewerk je beoordeling', 'Pin selected':'Kaartpin geselecteerd', 'Tap the map to drop a pin':'Tik op de kaart om een pin te plaatsen',
    'The map could not load. You can still enter the address manually.':'De kaart kon niet worden geladen. Je kunt het adres nog handmatig invoeren.',
    'The map is unavailable. Enter the address manually.':'De kaart is niet beschikbaar. Voer het adres handmatig in.',
    'A new version is ready.':'Er staat een nieuwe versie klaar.', 'Update app':'App bijwerken',
    'Offline support is unavailable in this browser.':'Offlinegebruik is niet beschikbaar in deze browser.',
    'Offline support requires HTTPS (localhost is allowed for development).':'Offlinegebruik vereist HTTPS (localhost is toegestaan voor ontwikkeling).',
    'The app update failed to install. The current version is still available.':'De app-update kon niet worden geïnstalleerd. De huidige versie blijft beschikbaar.',
    'Could not check for an app update. Try again when the connection is stable.':'Controleren op een app-update is mislukt. Probeer het opnieuw met een stabiele verbinding.',
    'Offline support could not start. The app still works while this page is open.':'Offlinegebruik kon niet starten. De app blijft werken zolang deze pagina open is.',
    'No app update is waiting.':'Er staat geen app-update klaar.', 'Could not apply the app update. Reload and try again.':'De app-update kon niet worden toegepast. Herlaad de pagina en probeer opnieuw.'
  };
  Object.assign(copy, {"Verifying your email link…":"Je e-maillink controleren…","This email link expired or was already used. Request a new password reset link.":"Deze e-maillink is verlopen of al gebruikt. Vraag een nieuwe herstellink aan.","Invalid login credentials":"Onjuist e-mailadres of wachtwoord","Email not confirmed":"E-mailadres niet bevestigd","Members · Beste Belgische Bolognaise":"Leden · Beste Belgische Bolognaise","Rating overview · Beste Belgische Bolognaise":"Ratingoverzicht · Beste Belgische Bolognaise","Keep your personal ratings of spaghetti bolognaise across Belgium.":"Bewaar je persoonlijke beoordelingen van spaghetti bolognaise in België.","Invalid member.":"Ongeldig lid.","Member not found in this group.":"Lid niet gevonden in deze groep."});
  Object.assign(copy, {
    'Could not verify group membership.':'Het groepslidmaatschap kon niet worden gecontroleerd.',
    'This account is not a member of this group.':'Dit account is geen lid van deze groep.'
  });
  const french = {
  "Could not verify group membership.": "Impossible de vérifier l’adhésion au groupe.",
  "This account is not a member of this group.": "Ce compte ne fait pas partie de ce groupe.",
  "Change member access": "Modifier l’accès du membre",
  "Deactivate": "Désactiver",
  "Reactivate": "Réactiver",
  "Deactivated": "Désactivé",
  "Deactivating member…": "Désactivation du membre…",
  "Reactivating member…": "Réactivation du membre…",
  "Member deactivated. Their ratings are preserved.": "Membre désactivé. Ses évaluations sont conservées.",
  "Member reactivated. Their group access is restored.": "Membre réactivé. Son accès au groupe est rétabli.",
  "This member is deactivated. Use Reactivate to restore access.": "Ce membre est désactivé. Cliquez sur Réactiver pour rétablir son accès.",
  "Deactivate this member? They will lose group access. Their ratings will be preserved.": "Désactiver ce membre ? Il perdra l’accès au groupe. Ses évaluations seront conservées.",
  "Reactivate this member and restore their group access?": "Réactiver ce membre et rétablir son accès au groupe ?",
  "The account status could not be changed. Try again.": "Le statut du compte n’a pas pu être modifié. Réessayez.",
  "You cannot deactivate your own account.": "Vous ne pouvez pas désactiver votre propre compte.",
  "Group owners cannot be deactivated.": "Les propriétaires du groupe ne peuvent pas être désactivés.",
  "The membership changed. Refresh and try again.": "L’adhésion a changé. Actualisez et réessayez.",
  "Cancel": "Annuler",
  "Change name": "Modifier le nom",
  "Change your name": "Modifier votre nom",
  "Save name": "Enregistrer le nom",
  "This name appears next to your ratings.": "Ce nom apparaît à côté de vos évaluations.",
  "Saving your name…": "Enregistrement de votre nom…",
  "Enter a name between 1 and 80 characters.": "Saisissez un nom de 1 à 80 caractères.",
  "Your name could not be saved. Try again.": "Votre nom n’a pas pu être enregistré. Réessayez.",
  "Move map pin": "Déplacer le repère",
  "Location selected from search": "Lieu sélectionné dans les résultats",
  "Pin selected. You can move it on the map.": "Repère sélectionné. Vous pouvez le déplacer sur la carte.",
  "Choose a valid date that is not in the future.": "Choisissez une date valide qui n’est pas dans le futur.",
  "Location search is unavailable. Enter an address and choose a spot on the map.": "La recherche de lieux est indisponible. Saisissez une adresse et choisissez un point sur la carte.",
  "Rating overview": "Vue d’ensemble des évaluations",
  "Every plate,": "Chaque assiette,",
  "around the table.": "autour de la table.",
  "Explore the ratings and favourite places shared by your group.": "Découvrez les évaluations et les lieux favoris partagés par votre groupe.",
  "Group rating summary": "Résumé des évaluations du groupe",
  "Group spaghetti map": "Carte des spaghettis du groupe",
  "Map of Belgium showing group spaghetti ratings": "Carte de Belgique affichant les évaluations de spaghettis du groupe",
  "Select a marker to see the ratings for that restaurant. Ratings without a location are listed above.": "Sélectionnez un repère pour voir les évaluations du restaurant. Celles sans localisation figurent ci-dessus.",
  "No ratings yet.": "Aucune évaluation pour le moment.",
  "Could not load group ratings. Reload and try again.": "Impossible de charger les évaluations du groupe. Rechargez la page et réessayez.",
  "The map could not load. You can still browse the ratings above.": "La carte n’a pas pu être chargée. Vous pouvez consulter les évaluations ci-dessus.",
  "Manage members": "Gérer les membres",
  "Home": "Accueil",
  "Your people,": "Vos proches,",
  "at the same table.": "à la même table.",
  "Invite friends to rate and remember great spaghetti together.": "Invitez des amis à évaluer de bons spaghettis et à en garder le souvenir ensemble.",
  "Back to ratings": "Retour aux évaluations",
  "Checking your access…": "Vérification de votre accès…",
  "MAKE ROOM AT THE TABLE": "FAITES UNE PLACE À TABLE",
  "Add a member": "Ajouter un membre",
  "Add member": "Ajouter le membre",
  "New members receive an email to set their own password. Existing accounts keep their password.": "Les nouveaux membres reçoivent un e-mail pour définir leur mot de passe. Les comptes existants conservent le leur.",
  "Display name": "Nom affiché",
  "optional": "facultatif",
  "How should we call them?": "Comment l’appeler ?",
  "YOUR SPAGHETTI CLUB": "VOTRE CLUB DE SPAGHETTIS",
  "Around the table": "Autour de la table",
  "Refresh": "Actualiser",
  "Loading members…": "Chargement des membres…",
  "Owner": "Propriétaire",
  "Member": "Membre",
  "Account active": "Compte actif",
  "Waiting for account activation": "En attente d’activation du compte",
  "Resend invitation": "Renvoyer l’invitation",
  "Sending invitation…": "Envoi de l’invitation…",
  "Adding member…": "Ajout du membre…",
  "Invitation sent. They can choose a password using the email link.": "Invitation envoyée. Le lien dans l’e-mail permet de choisir un mot de passe.",
  "This person is already a member. Their access is ready.": "Cette personne est déjà membre. Son accès est prêt.",
  "Existing account added. They can sign in with their own password.": "Compte existant ajouté. La connexion se fait avec son propre mot de passe.",
  "Group access is ready. Use Resend invitation to send a fresh activation email.": "L’accès au groupe est prêt. Cliquez sur Renvoyer l’invitation pour envoyer un nouvel e-mail d’activation.",
  "Member added.": "Membre ajouté.",
  "The app could not connect. Reload and try again.": "L’application n’a pas pu se connecter. Rechargez la page et réessayez.",
  "Sign out failed. Try again.": "La déconnexion a échoué. Réessayez.",
  "Sign in as a group owner first.": "Connectez-vous d’abord en tant que propriétaire du groupe.",
  "Your session expired. Sign in again.": "Votre session a expiré. Reconnectez-vous.",
  "Could not verify group permissions.": "Impossible de vérifier les autorisations du groupe.",
  "Only a group owner can invite members.": "Seul un propriétaire du groupe peut inviter des membres.",
  "Could not check invitation limits. Try again later.": "Impossible de vérifier les limites d’invitation. Réessayez plus tard.",
  "You have sent too many invitations. Try again in an hour.": "Vous avez envoyé trop d’invitations. Réessayez dans une heure.",
  "Enter a valid email address and group.": "Saisissez une adresse e-mail et un groupe valides.",
  "Could not look up member accounts. Try again.": "Impossible de rechercher les comptes des membres. Réessayez.",
  "Could not load members. Try again.": "Impossible de charger les membres. Réessayez.",
  "The invitation could not be sent. Check the email address and try again.": "L’invitation n’a pas pu être envoyée. Vérifiez l’adresse e-mail et réessayez.",
  "Could not verify group membership. Try again.": "Impossible de vérifier l’adhésion au groupe. Réessayez.",
  "The account exists, but group access could not be added. Retry to finish adding this member.": "Le compte existe, mais l’accès au groupe n’a pas pu être ajouté. Réessayez pour terminer l’ajout de ce membre.",
  "Group access is ready, but the invitation email could not be sent. Try resending it.": "L’accès au groupe est prêt, mais l’e-mail d’invitation n’a pas pu être envoyé. Essayez de le renvoyer.",
  "Could not complete this request. Try again.": "Impossible de terminer cette demande. Réessayez.",
  "Invalid request.": "Demande invalide.",
  "SHARED SPAGHETTI CLUB": "CLUB DE SPAGHETTIS PARTAGÉ",
  "Sign in": "Se connecter",
  "Only invited members can access shared ratings.": "Seuls les membres invités ont accès aux évaluations partagées.",
  "THE SEARCH FOR A PERFECT PLATE": "À LA RECHERCHE DE L’ASSIETTE PARFAITE",
  "Good spaghetti": "De bons spaghettis",
  "is worth remembering.": "ça ne s’oublie pas.",
  "Rate the bolognaise, remember the place, and find your Belgian favourite.": "Évaluez la bolognaise, retenez l’adresse et trouvez votre favorite en Belgique.",
  "Your rating summary": "Résumé de vos évaluations",
  "plates rated": "assiettes évaluées",
  "average score": "note moyenne",
  "YOUR TASTING NOTES": "VOS NOTES DE DÉGUSTATION",
  "Rate a plate": "Évaluer une assiette",
  "Restaurant": "Restaurant",
  "Where did you eat?": "Où avez-vous mangé ?",
  "Date": "Date",
  "Restaurant location": "Localisation du restaurant",
  "optional · search for a place or enter a town": "facultatif · recherchez un lieu ou saisissez une ville",
  "Restaurant name, street, or town": "Nom du restaurant, rue ou ville",
  "Place suggestions": "Suggestions de lieux",
  "Choose a suggestion to set the map pin automatically.": "Choisissez une suggestion pour placer le repère automatiquement.",
  "Choose spot on map": "Choisir un point sur la carte",
  "No map pin selected": "Aucun repère sélectionné",
  "Give each one a score": "Attribuez une note à chaque critère",
  "1 = needs work · 5 = excellent": "1 = à améliorer · 5 = excellent",
  "Sauce": "Sauce",
  "Pasta texture": "Texture des pâtes",
  "Texture": "Texture",
  "Portion": "Portion",
  "Sauce rating": "Note de la sauce",
  "Pasta texture rating": "Note de la texture des pâtes",
  "Portion rating": "Note de la portion",
  "The little extras": "Les petits plus",
  "Enough cheese": "Assez de fromage",
  "Hot sauce": "Sauce piquante",
  "Gratinated": "Gratiné",
  "Great location": "Cadre agréable",
  "Warm hospitality": "Accueil chaleureux",
  "Save this plate": "Enregistrer cette assiette",
  "Cancel editing": "Annuler la modification",
  "Ratings are shared with your group.": "Les évaluations sont partagées avec votre groupe.",
  "YOUR PERSONAL GUIDE": "VOTRE GUIDE PERSONNEL",
  "Rated & remembered": "Évalué et mémorisé",
  "WHERE THE GOOD PLATES ARE": "OÙ TROUVER LES BONNES ASSIETTES",
  "Your spaghetti map": "Votre carte des spaghettis",
  "Choose “Choose spot on map” while adding a rating, then tap the map to place its pin. You can zoom and drag to find the restaurant.": "Lors de l’ajout d’une évaluation, cliquez sur « Choisir un point sur la carte », puis touchez la carte pour placer le repère. Zoomez et déplacez la carte pour trouver le restaurant.",
  "Map of Belgium showing your spaghetti ratings": "Carte de Belgique affichant vos évaluations de spaghettis",
  "Zoom in": "Zoom avant",
  "Zoom out": "Zoom arrière",
  "Marker": "Repère",
  "Close popup": "Fermer la fenêtre",
  "Map data ©": "Données cartographiques ©",
  "OpenStreetMap contributors": "Contributeurs OpenStreetMap",
  "MADE FOR THE LOVE OF A GOOD BOLOGNAISE": "POUR L’AMOUR D’UNE BONNE BOLOGNAISE",
  "Belgium · one plate at a time": "Belgique · une assiette à la fois",
  "Beste Belgische Bolognaise home": "Accueil de Beste Belgische Bolognaise",
  "Account": "Compte",
  "Language": "Langue",
  "Invite a friend": "Inviter un ami",
  "Change password": "Modifier le mot de passe",
  "Sign out": "Se déconnecter",
  "Email": "E-mail",
  "Password": "Mot de passe",
  "Forgot password?": "Mot de passe oublié ?",
  "Invite": "Inviter",
  "Choose a password": "Choisissez un mot de passe",
  "Set new password": "Définir un nouveau mot de passe",
  "Activate account": "Activer le compte",
  "Saving your password…": "Enregistrement de votre mot de passe…",
  "Password updated. Signing you in…": "Mot de passe modifié. Connexion en cours…",
  "Loading shared ratings…": "Chargement des évaluations partagées…",
  "Choose all three scores first.": "Choisissez d’abord les trois notes.",
  "This account is not in this group. Ask the owner for an invitation.": "Ce compte ne fait pas partie de ce groupe. Demandez une invitation au propriétaire.",
  "Saving…": "Enregistrement…",
  "Rating saved and shared.": "Évaluation enregistrée et partagée.",
  "That reset link expired or was already used. Enter your email and request a new link.": "Ce lien de réinitialisation a expiré ou a déjà été utilisé. Saisissez votre e-mail et demandez un nouveau lien.",
  "Enter your email above first.": "Saisissez d’abord votre e-mail ci-dessus.",
  "Sending password reset email…": "Envoi de l’e-mail de réinitialisation…",
  "Password reset email sent. Check your inbox and open the newest link.": "E-mail de réinitialisation envoyé. Consultez votre boîte de réception et ouvrez le lien le plus récent.",
  "Invitation sent.": "Invitation envoyée.",
  "View this rating": "Voir cette évaluation",
  "Show on map": "Afficher sur la carte",
  "Edit": "Modifier",
  "Remove": "Supprimer",
  "Your first plate awaits.": "Votre première assiette vous attend.",
  "Show less": "Afficher moins",
  "Remove rating?": "Supprimer cette évaluation ?",
  "Edit your rating": "Modifier votre évaluation",
  "Pin selected": "Repère sélectionné",
  "Tap the map to drop a pin": "Touchez la carte pour placer un repère",
  "The map could not load. You can still enter the address manually.": "La carte n’a pas pu être chargée. Vous pouvez saisir l’adresse manuellement.",
  "The map is unavailable. Enter the address manually.": "La carte est indisponible. Saisissez l’adresse manuellement.",
  "A new version is ready.": "Une nouvelle version est disponible.",
  "Update app": "Mettre à jour l’application",
  "Offline support is unavailable in this browser.": "Le mode hors ligne est indisponible dans ce navigateur.",
  "Offline support requires HTTPS (localhost is allowed for development).": "Le mode hors ligne nécessite HTTPS (localhost est autorisé pour le développement).",
  "The app update failed to install. The current version is still available.": "La mise à jour n’a pas pu être installée. La version actuelle reste disponible.",
  "Could not check for an app update. Try again when the connection is stable.": "Impossible de vérifier les mises à jour. Réessayez avec une connexion stable.",
  "Offline support could not start. The app still works while this page is open.": "Le mode hors ligne n’a pas pu démarrer. L’application fonctionne tant que cette page reste ouverte.",
  "No app update is waiting.": "Aucune mise à jour en attente.",
  "Could not apply the app update. Reload and try again.": "Impossible d’appliquer la mise à jour. Rechargez la page et réessayez.",
  "Verifying your email link…": "Vérification de votre lien reçu par e-mail…",
  "This email link expired or was already used. Request a new password reset link.": "Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien de réinitialisation.",
  "Invalid login credentials": "E-mail ou mot de passe incorrect",
  "Email not confirmed": "Adresse e-mail non confirmée",
  "Members · Beste Belgische Bolognaise": "Membres · Beste Belgische Bolognaise",
  "Rating overview · Beste Belgische Bolognaise": "Évaluations · Beste Belgische Bolognaise",
  "Keep your personal ratings of spaghetti bolognaise across Belgium.": "Retrouvez vos évaluations personnelles de spaghettis bolognaise en Belgique.",
  "Invalid member.": "Membre invalide.",
  "Member not found in this group.": "Membre introuvable dans ce groupe."
};
  Object.assign(copy, {"Comment (optional)": "Opmerking (optioneel)", "Would you like to explain your rating?": "Wil je je beoordeling toelichten?", "Maximum 500 characters.": "Maximaal 500 tekens.", "Your comment cannot exceed 500 characters.": "Je opmerking mag maximaal 500 tekens bevatten.", "Read more": "Meer lezen", "Show less comment": "Minder tonen", "Comment character count": "Aantal tekens in de opmerking"});
  Object.assign(french, {"Comment (optional)": "Commentaire (facultatif)", "Would you like to explain your rating?": "Souhaitez-vous préciser votre évaluation ?", "Maximum 500 characters.": "Maximum 500 caractères.", "Your comment cannot exceed 500 characters.": "Votre commentaire ne peut pas dépasser 500 caractères.", "Read more": "Lire la suite", "Show less comment": "Afficher moins", "Comment character count": "Nombre de caractères du commentaire"});
  let language = 'en';
  const browserLanguage = navigator.language.toLowerCase().split('-')[0];
  if (['nl', 'fr'].includes(browserLanguage)) language = browserLanguage;
  try { language = localStorage.getItem('bbb-language') || language; } catch {}
  if (!['en', 'nl', 'fr'].includes(language)) language = 'en';
  const originals = new WeakMap();
  const attributes = new WeakMap();
  function translate(text) {
    if (language === 'en') return text.replace(/^Show less comment$/, 'Show less').replace(/^1 plates$/, '1 plate').replace(/^1 places$/, '1 place');
    const trimmed = text.trim();
    const catalog = language === 'fr' ? french : copy;
    let result = Object.hasOwn(catalog, trimmed) ? catalog[trimmed] : undefined;
    if (result === undefined) {
      let match;
      if ((match = trimmed.match(/^(\d+) plates$/))) result = match[1] + (language === 'fr' ? (+match[1] === 1 ? ' assiette' : ' assiettes') : (+match[1] === 1 ? ' bord' : ' borden'));
      else if ((match = trimmed.match(/^(\d+) places$/))) result = match[1] + (language === 'fr' ? (+match[1] === 1 ? ' lieu' : ' lieux') : (+match[1] === 1 ? ' plek' : ' plekken'));
      else if ((match = trimmed.match(/^Show more \((\d+)\)$/))) result = (language === 'fr' ? 'Afficher plus (' : 'Toon meer (') + match[1] + ')';
      else if (trimmed.startsWith('Save failed: ')) result = trimmed.replace('Save failed: ', language === 'fr' ? 'Échec de l’enregistrement : ' : 'Opslaan mislukt: ').replace(' Your entries are still here; retry.', language === 'fr' ? ' Vos données sont conservées ; réessayez.' : ' Je invoer is bewaard; probeer het opnieuw.');
      else if (trimmed.startsWith('Sign out failed: ')) result = trimmed.replace('Sign out failed: ', language === 'fr' ? 'Échec de la déconnexion : ' : 'Afmelden mislukt: ');
    }
    return result === undefined ? text : text.replace(trimmed, result);
  }
  function refresh() {
    document.documentElement.lang = language;
    // Head copy also follows the selected UI language.
    for (const element of document.querySelectorAll('title,meta[name="description"]')) {
      const isMeta = element.tagName === 'META';
      const value = isMeta ? element.content : element.textContent;
      let record = originals.get(element);
      if (!record || value !== record.rendered) record = { source: value };
      record.rendered = translate(record.source);
      originals.set(element, record);
      if (value !== record.rendered) {
        if (isMeta) element.content = record.rendered; else element.textContent = record.rendered;
      }
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      // Exclude all user-controlled fields and third-party map content.
      if (node.parentElement.closest('script,style,textarea,option,[data-i18n-skip],.card-name,.card-date,.card-location,#account-name,.leaflet-pane,.leaflet-control,#place-suggestions')) continue;
      let record = originals.get(node);
      if (!record || node.nodeValue !== record.rendered) record = { source: node.nodeValue };
      record.rendered = translate(record.source);
      originals.set(node, record);
      if (node.nodeValue !== record.rendered) node.nodeValue = record.rendered;
    }
    document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(element => {
      let records = attributes.get(element) || {};
      for (const name of ['placeholder', 'aria-label', 'title', 'alt']) {
        if (!element.hasAttribute(name)) continue;
        const value = element.getAttribute(name);
        let record = records[name];
        if (!record || value !== record.rendered) record = { source: value };
        record.rendered = translate(record.source);
        records[name] = record;
        if (value !== record.rendered) element.setAttribute(name, record.rendered);
      }
      attributes.set(element, records);
    });
    const select = document.querySelector('#ui-language');
    if (select) select.value = language;
    const account = document.querySelector('#account-controls');
    const fallback = document.querySelector('.language-menu');
    const field = document.querySelector('#language-field');
    if (account && fallback && field) {
      const destination = account.hidden ? fallback.querySelector('.account-dropdown') : account.querySelector('.account-dropdown');
      if (field.parentElement !== destination) destination.append(field);
      if (fallback.hidden !== !account.hidden) fallback.hidden = !account.hidden;
    }
  }
  window.UI = { t: translate };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.topbar').insertAdjacentHTML('beforeend', '<details class="account-menu language-menu"><summary><span>Language</span></summary><div class="account-dropdown"><div id="language-field"><label for="ui-language">Language</label><select id="ui-language"><option value="nl">Nederlands</option><option value="en">English</option><option value="fr">Français</option></select></div></div></details>');
    document.querySelector('#ui-language').addEventListener('change', event => {
      language = event.target.value;
      try { localStorage.setItem('bbb-language', language); } catch {}
      refresh();
    });
    refresh();
    new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title', 'alt', 'hidden'] });
  });
})();
