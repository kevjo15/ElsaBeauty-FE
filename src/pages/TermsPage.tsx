import { Link } from "react-router-dom";
import LegalPage, {
  LegalSection,
  LegalList,
} from "@/components/layout/legal-page";

/** Användarvillkor för bokningstjänsten. */
const TermsPage = () => {
  return (
    <LegalPage
      title="Användarvillkor"
      intro={
        <p>
          Dessa villkor gäller när du använder ElsaBeautys webbplats och
          bokningstjänst. Genom att skapa ett konto eller boka en behandling
          godkänner du villkoren. Läs dem gärna tillsammans med vår{" "}
          <Link className="link" to="/privacy">
            integritetspolicy
          </Link>
          .
        </p>
      }
    >
      <LegalSection heading="1. Om tjänsten">
        <p>
          Tjänsten tillhandahålls av ElsaBeauty, Storgatan 15, 123 45 Stockholm
          (org.nr <em>[fyll i organisationsnummer]</em>). Via tjänsten kan du läsa
          om våra behandlingar, boka och avboka tider, se din bokningshistorik och
          kommunicera med kliniken.
        </p>
      </LegalSection>

      <LegalSection heading="2. Ditt konto">
        <LegalList>
          <li>
            Du behöver vara minst 18 år för att skapa ett konto och boka
            behandlingar.
          </li>
          <li>
            Uppgifterna du lämnar ska vara korrekta och hållas uppdaterade. Vi
            behöver kunna nå dig inför ditt besök.
          </li>
          <li>
            Du ansvarar för att skydda dina inloggningsuppgifter och för det som
            sker via ditt konto. Misstänker du obehörig användning ska du kontakta
            oss omgående.
          </li>
          <li>
            Du kan när som helst radera ditt konto under <em>Min profil</em>.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection heading="3. Bokning och avbokning">
        <LegalList>
          <li>
            En bokning är bindande när den bekräftats i tjänsten. Du får en
            bekräftelse och, som standard, en påminnelse cirka ett dygn före
            besöket.
          </li>
          <li>
            Du kan avboka din tid via tjänsten. Avboka senast 24 timmar före
            besöket så att någon annan kan använda tiden.
          </li>
          <li>
            Vid uteblivet besök, eller avbokning senare än 24 timmar före besöket,
            kan kliniken komma att ta ut en avgift. Du informeras i så fall i
            förväg.
          </li>
          <li>
            Vi förbehåller oss rätten att boka om eller ställa in en tid, till
            exempel vid sjukdom. Vi kontaktar dig då så snart vi kan.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection heading="4. Priser och betalning">
        <p>
          Priser anges i svenska kronor. Vi reserverar oss för prisändringar och
          för eventuella felskrivningar. All kortbetalning hanteras av vår
          betalningsleverantör Stripe — vi lagrar aldrig ditt kortnummer.
        </p>
        <p>
          När du bokar väljer du hur du vill betala:
        </p>
        <LegalList>
          <li>
            <strong>Betala online.</strong> Hela priset betalas direkt vid
            bokningen — med kort, Google Pay, Apple Pay eller Klarna.
            Behandlingen är då fullt betald.
          </li>
          <li>
            <strong>Betala på plats (sparat kort).</strong> Inget dras vid
            bokningen — ditt kort sparas endast som säkerhet. Du betalar hela
            beloppet på plats.
          </li>
        </LegalList>
        <p>
          <strong>Återbetalning vid avbokning.</strong> Har du betalat online och
          avbokar <strong>senast 24 timmar</strong> före besöket återbetalas det
          inbetalda beloppet i sin helhet till ditt kort. Vid avbokning{" "}
          <strong>senare än 24 timmar</strong> före besöket, eller vid uteblivet
          besök, behålls det inbetalda beloppet som avgift enligt punkt 3.
        </p>
        <p>
          Har du valt <strong>betala på plats</strong> och uteblir, eller avbokar
          senare än 24 timmar före besöket, kan no-show-avgiften (se punkt 3) dras
          från ditt sparade kort. I övrigt debiteras kortet aldrig via tjänsten.
        </p>
      </LegalSection>

      <LegalSection heading="5. Behandlingar och medicinskt ansvar">
        <LegalList>
          <li>
            Behandlingarna utförs av legitimerad vårdpersonal. Inför behandling
            görs alltid en bedömning, och vi kan avråda från eller neka en
            behandling om den inte är lämplig för dig.
          </li>
          <li>
            Du ansvarar för att lämna korrekt information om din hälsa, dina
            mediciner och tidigare behandlingar. Ofullständiga uppgifter kan
            innebära risker.
          </li>
          <li>
            Resultat varierar från person till person. Ingen garanti lämnas för ett
            visst resultat.
          </li>
          <li>
            Informationen på webbplatsen är allmän och ersätter inte individuell
            medicinsk rådgivning.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection heading="6. Chatt och kommunikation">
        <p>
          Chatten i tjänsten är avsedd för praktiska frågor om din bokning. Den är{" "}
          <strong>inte</strong> avsedd för akuta medicinska ärenden och bevakas
          inte dygnet runt. Vid akuta besvär, kontakta 1177 Vårdguiden eller ring
          112.
        </p>
        <p>
          Du får inte använda tjänsten för att skicka olagligt, kränkande eller
          skadligt innehåll, eller för att göra intrång i andras rättigheter.
        </p>
      </LegalSection>

      <LegalSection heading="7. Otillåten användning">
        <p>
          Du får inte försöka kringgå tjänstens säkerhet, störa driften, hämta
          uppgifter automatiserat eller använda tjänsten på ett sätt som strider
          mot lag. Vi kan stänga av konton som används i strid med dessa villkor.
        </p>
      </LegalSection>

      <LegalSection heading="8. Immateriella rättigheter">
        <p>
          Allt innehåll på webbplatsen — text, bilder, logotyper och grafik —
          tillhör ElsaBeauty eller våra licensgivare och får inte användas utan
          vårt skriftliga tillstånd.
        </p>
      </LegalSection>

      <LegalSection heading="9. Ansvarsbegränsning">
        <p>
          Tjänsten tillhandahålls i befintligt skick. Vi ansvarar inte för
          tillfälliga avbrott, förlust av data eller indirekta skador, i den
          utsträckning sådan ansvarsfriskrivning är tillåten enligt lag. Inget i
          dessa villkor begränsar ditt lagstadgade konsumentskydd eller vårt ansvar
          för personskada orsakad av vårdslöshet.
        </p>
      </LegalSection>

      <LegalSection heading="10. Ändringar av villkoren">
        <p>
          Vi kan komma att uppdatera dessa villkor. Väsentliga ändringar meddelas i
          tjänsten eller via e-post. Datumet överst på sidan visar när villkoren
          senast ändrades. Fortsatt användning efter en ändring innebär att du
          godtar de nya villkoren.
        </p>
      </LegalSection>

      <LegalSection heading="11. Tillämplig lag och tvist">
        <p>
          Svensk lag gäller för dessa villkor. Vid tvist som vi inte kan lösa
          tillsammans kan du vända dig till{" "}
          <a
            className="link"
            href="https://www.arn.se"
            target="_blank"
            rel="noopener noreferrer"
          >
            Allmänna reklamationsnämnden (ARN)
          </a>{" "}
          eller till allmän domstol.
        </p>
      </LegalSection>

      <LegalSection heading="12. Kontakt">
        <p>
          Har du frågor om villkoren når du oss på{" "}
          <a className="link" href="mailto:info@elsabeauty.se">
            info@elsabeauty.se
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default TermsPage;
