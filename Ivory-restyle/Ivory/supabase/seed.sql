-- ============================================================
-- SEED DATA — maakt het Shajar-project aan met bestaande risico's,
-- scope, taken en partijen uit de projectdocumenten.
-- Draai dit NA schema.sql en NADAT je minstens één keer bent
-- ingelogd (zodat er een profiel bestaat).
-- ============================================================

do $$
declare
  v_project_id uuid;
  v_user_id uuid;
begin
  -- Pak de eerste ingelogde gebruiker als projecteigenaar/aanmaker
  select id into v_user_id from profiles order by created_at limit 1;

  -- Project aanmaken
  insert into projects (name, slug, client, location, description, created_by)
  values (
    'Shajar Hospital',
    'shajar-hospital',
    'QHC Architects & Engineers',
    'Dibba Al Husn, VAE',
    'Complete inrichting en medische uitrusting van een nieuw ziekenhuis. 3.267 regelitems, 24 afdelingen, 4 verdiepingen.',
    v_user_id
  )
  returning id into v_project_id;

  -- Aanmaker als lid toevoegen (indien de trigger dit nog niet deed omdat dit via SQL Editor loopt, niet via de auth-context)
  insert into project_members (project_id, user_id, role, visible)
  values (v_project_id, v_user_id, 'eigenaar', true)
  on conflict do nothing;

  -- Scope-items
  insert into scope_items (project_id, item_name, in_scope, explanation, source_reference, source_date) values
  (v_project_id, 'CT-scanner (RD20162, 256-slice) + werkplek + contrastinjector', true, 'Bevestigd in MEQ BOQ. MRI expliciet buiten scope.', 'QHC Q&C', '2026-08-06'),
  (v_project_id, 'MRI-scanner', false, 'Niet aanwezig in MEQ BOQ of specificaties.', 'QHC Q&C', '2026-08-06'),
  (v_project_id, 'HIS/EPD-platform (software, servers, licenties)', false, 'Bevestigd buiten scope. Bespaart €0,5-2M op de raming.', 'QHC Q&C', '2026-08-06'),
  (v_project_id, 'Apparatuurzijdige interfaces (HL7, DICOM, TCP/IP)', true, 'Communicatiepoorten, interfacehardware, standaardsoftware.', 'QHC Q&C', '2026-08-06'),
  (v_project_id, 'Terminale medische gasaansluitingen (bedhoofdborden, hangers, consoles)', true, 'Centrale installatie en leidingwerk vallen onder MEP.', 'QHC Q&C', '2026-08-06'),
  (v_project_id, 'Centrale medische gasinstallatie en distributiepijpleidingen', false, 'Verantwoordelijkheid MEP-aannemer (Divisie 22).', 'QHC Q&C', '2026-08-06'),
  (v_project_id, 'Nurse-call voorzieningen en aansluitpunten in bedhoofdborden', true, 'Centrale controllers/servers/bekabeling vallen onder ELV.', 'QHC Q&C', '2026-08-06'),
  (v_project_id, 'Centraal nurse-call en IP-intercomsysteem', false, 'Verantwoordelijkheid Communicatie/ELV-aannemer (Divisie 27).', 'QHC Q&C', '2026-08-06'),
  (v_project_id, 'Apparatuurgeïntegreerde deionisatoren in CSSD-apparatuur', true, 'Voedingswaterkwaliteit per model te bevestigen met leverancier.', 'QHC Q&C', '2026-08-06'),
  (v_project_id, 'Centrale CSSD omgekeerd-osmose-installatie', false, 'Verantwoordelijkheid MEP/sanitair-aannemer (Divisie 22).', 'QHC Q&C', '2026-08-06');

  -- Risicoregister
  insert into risks (project_id, title, description, rating, status, mitigation) values
  (v_project_id, 'MDMA/MOHAP-registratiestatus onbekend', 'Klasse II/III-apparatuur kan tot 12 maanden doorlooptijd vereisen. QHC heeft niet bevestigd of proces is gestart.', 'hoog', 'open', 'Per item registratiestatus vermelden in tenderindiening; realistisch tijdschema opnemen; UAE-regelgevingsadviseur direct inschakelen.'),
  (v_project_id, 'Bouwprogramma niet beschikbaar', 'Geen gefaseerde handoverdatums per afdeling. Leverings- en installatieplanning kan niet worden opgesteld.', 'hoog', 'open', 'Voorwaardelijk voorbehoud in aanbieding; programma vóór gunning opvragen bij QHC.'),
  (v_project_id, 'Commerciële voorwaarden onbekend', 'Betaalschema, performance bond, DLP en Incoterm zijn nog niet vastgesteld door QHC.', 'hoog', 'open', 'Voorwaardelijk commercieel voorbehoud opnemen in de tender.'),
  (v_project_id, 'Off-site opslagkosten', 'Geen on-site stagingfaciliteit bevestigd; just-in-time levering verwacht.', 'midden', 'open', 'Pro-memoriepost (PM) voor off-site opslag opnemen in commerciële aanbieding.'),
  (v_project_id, 'Risico approved vendor list', 'Een goedgekeurde leverancierslijst kan alsnog per addendum worden uitgebracht, met herprijsrisico tot gevolg.', 'midden', 'open', 'Voor dure items meerdere conforme opties voorstellen.'),
  (v_project_id, 'Tenderdeadline onbekend', 'Zonder indiendatum is realistische planning niet mogelijk.', 'midden', 'open', 'ITT zo snel mogelijk opvragen bij QHC.'),
  (v_project_id, 'HIS/EPD-scope', 'Eerder aangenomen in scope, nu bevestigd buiten scope.', 'laag', 'opgelost', 'Kostenraming geactualiseerd; €0,5-2M besparing verwerkt.'),
  (v_project_id, 'CT-scanner, MRI en radiologieapparatuur', 'Scope was onzeker.', 'laag', 'opgelost', 'CT bevestigd in scope, MRI bevestigd buiten scope.'),
  (v_project_id, 'Medisch gas, nurse call en CSSD RO-water', 'Scopegrenzen waren onduidelijk.', 'laag', 'opgelost', 'Scopegrenzen bevestigd per QHC-antwoord 6 augustus 2026.');

  -- Externe partijen
  insert into parties (project_id, name, type, status, notes) values
  (v_project_id, 'QHC Architects & Engineers', 'Opdrachtgever / Architect', 'actief', 'Tender loopt via deze partij. Contactpersoon nog toe te voegen.'),
  (v_project_id, 'Specialist Nederlandse partner', 'Partner', 'in gesprek', 'Selectie loopt — nog te bevestigen. Optie 2: levert expertise en netwerk, Ivory behoudt controle.'),
  (v_project_id, 'Al Tamimi & Company', 'Juridisch adviseur', 'actief', 'Contractreview vóór ondertekening (Sharjah).'),
  (v_project_id, 'RVO', 'Exportondersteuning', 'in gesprek', 'DTIF-instrumenten en exportfinanciering.'),
  (v_project_id, 'Atradius Dutch State Business', 'Exportkredietverzekering', 'in gesprek', 'EKV ter afdekking van UAE-betaalrisico.'),
  (v_project_id, 'Medmark Consulting / InterMED Gulf', 'Regelgevingsadviseur', 'in gesprek', 'UAE MDMA/MOHAP-registratieondersteuning.');

  -- Directe prioriteiten als taken (fase 1)
  insert into tasks (project_id, title, description, status, phase_id, urgency) values
  (v_project_id, 'MDMA/MOHAP-registratie starten', 'UAE-regelgevingsadviseur inschakelen, klasse II/III-items inventariseren, registratietijdschema opstellen.', 'te_doen', 1, 'urgent'),
  (v_project_id, 'Gespecialiseerde Nederlandse partner selecteren', 'Shortlist minimaal 3 partijen met UAE-ziekenhuisreferenties, evalueren en selecteren.', 'te_doen', 1, 'urgent'),
  (v_project_id, 'Bouwprogramma en ITT opvragen bij QHC', 'Formeel schriftelijk verzoek indienen.', 'te_doen', 1, 'urgent'),
  (v_project_id, 'Juridische review leveringscontract', 'Al Tamimi & Company inschakelen vóór ondertekening.', 'te_doen', 1, 'urgent'),
  (v_project_id, 'Kostenraming actualiseren (HIS/EPD buiten scope)', 'Stelpost €0,5-2M verwijderen, AED 40M-ruimte bevestigen.', 'te_doen', 1, 'hoog'),
  (v_project_id, 'Langelevertijd-leveranciers benaderen', 'OK-hangers, chirurgische lampen, anesthesie-units, dialyse-installatie: 16-24 weken levertijd.', 'te_doen', 1, 'hoog'),
  (v_project_id, 'Lokale UAE-partner selecteren', 'Voor warehousing, MDMA-ondersteuning en after-sales in Sharjah.', 'te_doen', 1, 'hoog'),
  (v_project_id, 'Contact RVO / Atradius voor exportondersteuning', 'EKV en DTIF-instrumenten vroeg aanvragen.', 'te_doen', 1, 'hoog'),
  (v_project_id, 'Tenderdocumentatiematrix opbouwen', 'Op basis van QHC-checklist (verduidelijking 5.1).', 'te_doen', 1, 'hoog');

  -- Budget-snapshot
  insert into budget_snapshot (project_id, allocation, allocation_currency, estimate_low, estimate_high, notes) values
  (v_project_id, 10100000, 'EUR', 5100000, 9700000, 'AED 40M-toewijzing (~€10,1M) vs. herziene raming exclusief HIS/EPD.');

  -- Documentversies
  insert into document_versions (project_id, document_name, version, version_date, notes) values
  (v_project_id, 'Internal Memorandum', 'v4.0', '2026-08-16', 'Optie 2 geselecteerd als operationele structuur.'),
  (v_project_id, 'Stappenplan', 'v3.0', '2026-08-16', 'Bijgewerkt o.b.v. QHC Q&C en structuurbeslissing.'),
  (v_project_id, 'Action Plan', 'v3.0', '2026-08-16', 'Engelse versie van het stappenplan.');

  raise notice 'Shajar-project aangemaakt met id: %', v_project_id;
end $$;
