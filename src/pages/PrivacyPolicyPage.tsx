import { Link } from "react-router-dom";
import LegalPage, {
  LegalSection,
  LegalList,
} from "@/components/layout/legal-page";

/**
 * Integritetspolicy enligt GDPR art. 13–14. Innehållet speglar vad
 * applikationen faktiskt lagrar och skickar vidare — uppdatera denna sida
 * om datamodellen, notisflödet eller underbiträdena ändras.
 */
const PrivacyPolicyPage = () => {
  return (
    <LegalPage
      title="Integritetspolicy"
      intro={
        <p>
          Din integritet är viktig för oss. Här beskriver vi vilka
          personuppgifter ElsaBeauty samlar in när du använder vår webbplats och
          bokningstjänst, varför vi gör det, hur länge vi sparar uppgifterna och
          vilka rättigheter du har.
        </p>
      }
    >
      <LegalSection heading="1. Personuppgiftsansvarig">
        <p>
          ElsaBeauty (org.nr <em>[fyll i organisationsnummer]</em>) är
          personuppgiftsansvarig för behandlingen av dina personuppgifter.
        </p>
        <LegalList>
          <li>Adress: Storgatan 15, 123 45 Stockholm</li>
          <li>E-post: info@elsabeauty.se</li>
        </LegalList>
      </LegalSection>

      <LegalSection heading="2. Vilka uppgifter vi samlar in">
        <p>
          <strong>Kontouppgifter.</strong> När du skapar ett konto behandlar vi
          ditt förnamn, efternamn, e-postadress och telefonnummer. Ditt lösenord
          lagras aldrig i klartext, utan endast som en kryptografisk hash. Du kan
          frivilligt ladda upp en profilbild.
        </p>
        <p>
          <strong>Inloggning med Google.</strong> Om du väljer att logga in med
          Google tar vi emot ditt Google-användar-ID, din e-postadress samt ditt
          för- och efternamn från Google. Vi får aldrig ditt Google-lösenord. Om
          du redan har ett konto med samma verifierade e-postadress kopplas
          Google-inloggningen till det kontot.
        </p>
        <p>
          <strong>Betalningsuppgifter.</strong> När du sparar ett kort vid bokning
          hanteras själva kortuppgifterna av vår betalningsleverantör Stripe — de
          når aldrig våra servrar. Vi lagrar endast en referens (Stripe-kund- och
          betalningsmetod-id) samt kortets märke och sista fyra siffror, för att
          kunna dra en eventuell no-show-avgift och visa vilket kort som är sparat.
        </p>
        <p>
          <strong>Bokningar.</strong> Vald behandling, datum och tid, tilldelad
          personal samt bokningens status (aktiv eller avbokad).
        </p>
        <p>
          <strong>Meddelanden.</strong> Innehållet i chattkonversationer mellan
          dig och kliniken, inklusive tidpunkt och om meddelandet lästs.
        </p>
        <p>
          <strong>Aviseringar.</strong> De notiser vi skapar åt dig, till exempel
          bokningsbekräftelser, påminnelser och avbokningar.
        </p>
        <p>
          <strong>Teknisk säkerhetsinformation.</strong> När du loggar in sparar
          vi din IP-adress och din webbläsares identifieringssträng (user agent)
          kopplat till inloggningssessionen. Detta används för att kunna spärra
          sessioner och upptäcka obehörig åtkomst.
        </p>
        <p>
          <strong>Driftinformation.</strong> Vi använder Azure Application
          Insights för att mäta svarstider och upptäcka fel. Sådan telemetri kan
          innehålla IP-adress och vilka sidor eller anrop som gjorts.
        </p>
      </LegalSection>

      <LegalSection heading="3. Varför vi behandlar uppgifterna och på vilken rättslig grund">
        <LegalList>
          <li>
            <strong>För att fullgöra vårt avtal med dig</strong> (art. 6.1 b) —
            skapa och hantera ditt konto, genomföra bokningar, skicka
            bokningsbekräftelser, påminnelser och avbokningsmeddelanden, samt
            möjliggöra chatt med kliniken.
          </li>
          <li>
            <strong>För våra berättigade intressen</strong> (art. 6.1 f) — att
            hålla tjänsten säker (sessionsdata och IP-adresser) samt att drifta,
            felsöka och förbättra tjänsten (telemetri). Vi har bedömt att dessa
            intressen inte överväger din rätt till integritet.
          </li>
          <li>
            <strong>För att uppfylla rättsliga förpliktelser</strong> (art. 6.1
            c) — exempelvis bokförings- och redovisningskrav som gör att
            uppgifter om genomförda behandlingar måste bevaras.
          </li>
        </LegalList>
        <p>
          Vi använder inte dina uppgifter för marknadsföring och vi säljer aldrig
          dina personuppgifter vidare.
        </p>
      </LegalSection>

      <LegalSection heading="4. Uppgifter om hälsa">
        <p>
          Vissa av våra behandlingar utförs av legitimerad vårdpersonal. Uppgiften
          om att du har bokat en viss behandling kan därför i vissa fall utgöra en
          uppgift om din hälsa, vilket är en särskild kategori av personuppgifter
          enligt artikel 9 i GDPR. Sådana uppgifter behandlar vi endast i den
          utsträckning det behövs för att kunna utföra behandlingen på ett
          säkert sätt, och de omfattas dessutom av tystnadsplikt och, i
          förekommande fall, av patientdatalagens regler om journalföring.
        </p>
      </LegalSection>

      <LegalSection heading="5. Meddelanden vi skickar">
        <p>
          Vi skickar transaktionella meddelanden som hör till dina bokningar:
          bekräftelse, påminnelse (som standard cirka 24 timmar före besöket),
          avbokning och ändringar. Meddelandena kan skickas som avisering i
          tjänsten, som e-post och som SMS till det telefonnummer du angett.
          Påminnelsen innehåller behandlingens namn samt datum och tid.
        </p>
        <p>
          Dessa meddelanden är nödvändiga för att tjänsten ska fungera och kan i
          dagsläget inte stängas av var för sig. Vi skickar ingen reklam eller
          nyhetsbrev.
        </p>
      </LegalSection>

      <LegalSection heading="6. Vilka vi delar uppgifter med">
        <p>
          Vi anlitar följande personuppgiftsbiträden, som endast får behandla
          uppgifterna enligt våra instruktioner:
        </p>
        <LegalList>
          <li>
            <strong>Microsoft Azure</strong> — drift av applikationen, databas och
            lagring av bilder.
          </li>
          <li>
            <strong>Azure Communication Services</strong> — utskick av e-post och
            SMS.
          </li>
          <li>
            <strong>Azure Application Insights</strong> — drifttelemetri och
            felsökning.
          </li>
          <li>
            <strong>Stripe</strong> — betalningsleverantör som hanterar och lagrar
            dina kortuppgifter samt drar en eventuell no-show-avgift.
          </li>
          <li>
            <strong>Google</strong> — endast om du själv väljer att logga in med
            Google.
          </li>
        </LegalList>
        <p>
          Utöver detta kan uppgifter lämnas ut om vi är skyldiga till det enligt
          lag eller myndighetsbeslut.
        </p>
      </LegalSection>

      <LegalSection heading="7. Hur länge vi sparar uppgifterna">
        <LegalList>
          <li>
            <strong>Ditt konto</strong> sparas så länge du har det. Du kan när som
            helst radera det själv (se punkt 9).
          </li>
          <li>
            <strong>Inloggningssessioner</strong> (med IP-adress och user agent)
            sparas i högst 7 dagar, därefter upphör de att gälla. Din
            åtkomst-token lagras endast tillfälligt i webbläsarens minne och
            försvinner när du stänger fliken.
          </li>
          <li>
            <strong>Bokningshistorik</strong> sparas även efter att du raderat
            ditt konto, men då i avidentifierad form. Detta krävs för vår
            bokföring och för klinikens uppföljning.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection heading="8. Cookies och lagring i webbläsaren">
        <p>
          Vi använder endast en kaka, och den är nödvändig för att tjänsten ska
          fungera:
        </p>
        <LegalList>
          <li>
            <strong>refreshToken</strong> — håller dig inloggad. Den är{" "}
            <em>HttpOnly</em>, vilket innebär att den inte kan läsas av skript i
            webbläsaren, och den upphör efter 7 dagar.
          </li>
        </LegalList>
        <p>
          Vi använder inga cookies för analys, spårning eller marknadsföring.
          Utöver kakan sparar vi ditt val av ljust eller mörkt utseende lokalt i
          din webbläsare — det är ingen personuppgift.
        </p>
      </LegalSection>

      <LegalSection heading="9. Dina rättigheter">
        <p>Enligt GDPR har du rätt att:</p>
        <LegalList>
          <li>få veta vilka uppgifter vi behandlar om dig (registerutdrag),</li>
          <li>få felaktiga uppgifter rättade,</li>
          <li>få dina uppgifter raderade,</li>
          <li>invända mot eller begära begränsning av behandlingen,</li>
          <li>få ut dina uppgifter i ett maskinläsbart format (dataportabilitet).</li>
        </LegalList>
        <p>
          <strong>Så fungerar radering.</strong> Du kan radera ditt konto själv
          under <em>Min profil</em>. När du gör det tar vi bort ditt namn, din
          e-postadress, ditt telefonnummer och din profilbild, kopplar bort en
          eventuell Google-inloggning, raderar ditt lösenord och avslutar alla
          dina inloggningssessioner. Din bokningshistorik behålls i avidentifierad
          form, eftersom vi är skyldiga att bevara underlag för genomförda
          behandlingar. Åtgärden går inte att ångra.
        </p>
        <p>
          Vill du utöva någon av dina övriga rättigheter kontaktar du oss på{" "}
          <a className="link" href="mailto:info@elsabeauty.se">
            info@elsabeauty.se
          </a>
          . Om du anser att vi behandlar dina uppgifter felaktigt har du rätt att
          klaga till{" "}
          <a
            className="link"
            href="https://www.imy.se"
            target="_blank"
            rel="noopener noreferrer"
          >
            Integritetsskyddsmyndigheten (IMY)
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="10. Hur vi skyddar uppgifterna">
        <p>
          All trafik till tjänsten sker krypterat. Lösenord lagras som
          kryptografiska hashar och de tokens som håller dig inloggad lagras
          hashade i databasen. Bilder ligger i ett privat lagringsutrymme och nås
          endast via tidsbegränsade länkar. Endast behörig personal kommer åt
          kunduppgifter, och administratörer ser bokningsunderlag med kundnamn i
          klinikens rapporter.
        </p>
      </LegalSection>

      <LegalSection heading="11. Ändringar i denna policy">
        <p>
          Vi kan komma att uppdatera denna policy. Vid väsentliga ändringar
          informerar vi dig i tjänsten eller via e-post. Datumet överst på sidan
          visar när policyn senast ändrades.
        </p>
        <p>
          Se även våra{" "}
          <Link className="link" to="/terms">
            användarvillkor
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default PrivacyPolicyPage;
