// UI copy only: member names, restaurant data and form values are never translated.
(() => {
  const copy = {
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
    'Invitation sent.':'Uitnodiging verstuurd.', 'Show on map':'Toon op de kaart', 'Edit':'Bewerken', 'Remove':'Verwijderen',
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
  let language = 'en';
  try { language = localStorage.getItem('bbb-language') || (navigator.language.startsWith('nl') ? 'nl' : 'en'); } catch {}
  if (!['en', 'nl'].includes(language)) language = 'en';
  const originals = new WeakMap();
  const attributes = new WeakMap();
  function translate(text) {
    if (language === 'en') return text.replace(/^1 plates$/, '1 plate').replace(/^1 places$/, '1 place');
    const trimmed = text.trim();
    let result = copy[trimmed];
    if (result === undefined) {
      let match;
      if ((match = trimmed.match(/^(\d+) plates$/))) result = match[1] + (+match[1] === 1 ? ' bord' : ' borden');
      else if ((match = trimmed.match(/^(\d+) places$/))) result = match[1] + (+match[1] === 1 ? ' plek' : ' plekken');
      else if ((match = trimmed.match(/^Show more \((\d+)\)$/))) result = 'Toon meer (' + match[1] + ')';
      else if (trimmed.startsWith('Save failed: ')) result = trimmed.replace('Save failed: ', 'Opslaan mislukt: ').replace(' Your entries are still here; retry.', ' Je invoer is bewaard; probeer het opnieuw.');
      else if (trimmed.startsWith('Sign out failed: ')) result = trimmed.replace('Sign out failed: ', 'Afmelden mislukt: ');
    }
    return result === undefined ? text : text.replace(trimmed, result);
  }
  function refresh() {
    document.documentElement.lang = language;
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
    document.querySelector('.topbar').insertAdjacentHTML('beforeend', '<details class="account-menu language-menu"><summary><span>Language</span></summary><div class="account-dropdown"><div id="language-field"><label for="ui-language">Language</label><select id="ui-language"><option value="nl">Nederlands</option><option value="en">English</option></select></div></div></details>');
    document.querySelector('#ui-language').addEventListener('change', event => {
      language = event.target.value;
      try { localStorage.setItem('bbb-language', language); } catch {}
      refresh();
    });
    refresh();
    new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title', 'alt', 'hidden'] });
  });
})();
