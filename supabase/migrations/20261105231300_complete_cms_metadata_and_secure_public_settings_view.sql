alter view public.public_website_settings set (security_invoker = true);

update public.media_assets
set alt_text = case
  when filename ilike '%logo%' then 'AETHER-TRADE brand logo'
  when filename ilike '%banner%' then 'AETHER-TRADE global technology banner'
  else alt_text
end
where coalesce(alt_text, '') = ''
  and filename ilike 'AETHER-TRADE%';

update public.content_records
set noindex = true
where publication = 'Draft'
  and module in ('insights', 'pages');

update public.content_records
set seo_title = case slug
  when 'home' then 'AETHER-TRADE — Automate Your International Trade Infrastructure'
  when 'about' then 'About — AETHER-TRADE'
  when 'automations' then 'Automation Catalogue — AETHER-TRADE'
  when 'contact' then 'Contact — AETHER-TRADE'
  when 'cookie-policy' then 'Cookie Policy — AETHER-TRADE'
  when 'custom-solutions' then 'Custom Automation, Workflows & AI Agents — AETHER-TRADE'
  when 'faqs' then 'FAQs — AETHER-TRADE'
  when 'how-it-works' then 'How It Works — AETHER-TRADE'
  when 'industries' then 'Industries — AETHER-TRADE'
  when 'insights' then 'Insights — AETHER-TRADE'
  when 'partnerships' then 'Partnerships — AETHER-TRADE'
  when 'platform' then 'Platform — AETHER-TRADE'
  when 'privacy-policy' then 'Privacy Policy — AETHER-TRADE'
  when 'request-demo' then 'Book an Operations Audit — AETHER-TRADE'
  when 'services' then 'Services — AETHER-TRADE'
  when 'solutions' then 'Solutions — AETHER-TRADE'
  when 'terms' then 'Terms of Use — AETHER-TRADE'
  else seo_title end,
seo_description = case slug
  when 'home' then 'AETHER-TRADE engineers custom document intelligence and end-to-end workflow automation for mid-market importers, exporters and logistics enterprises.'
  when 'about' then 'AETHER-TRADE builds more connected operations for global trade — human-controlled AI, evidence and operational clarity.'
  when 'automations' then 'Catalogue of trade-operations automations — inquiry triage, shipment follow-up, document intake, reconciliation, reporting and custom AI agents — each with its availability status.'
  when 'contact' then 'Contact AETHER-TRADE about trade operations automation, the platform or custom solutions.'
  when 'cookie-policy' then 'How AETHER-TRADE uses browser storage and essential website security features.'
  when 'custom-solutions' then 'Custom automation, AI agents, freight forwarding and shipment workflows, import-export operations, integrations and document intelligence.'
  when 'faqs' then 'Answers about AETHER-TRADE availability, AI and human review, document security and how engagements start.'
  when 'how-it-works' then 'How AETHER-TRADE engagements run: discover, scope, configure, pilot and expand — with human review at every step.'
  when 'industries' then 'Trade operations support across textiles, agriculture, machinery, consumer goods, chemicals and electronics.'
  when 'insights' then 'Practical perspectives on trade operations, document workflows and responsible AI in logistics.'
  when 'partnerships' then 'Partner with AETHER-TRADE as a technology provider, implementation partner or industry association.'
  when 'platform' then 'One intelligent platform for connected trade operations: case workspaces, document intelligence, cross-document checks and human-reviewed workflows.'
  when 'privacy-policy' then 'What information AETHER-TRADE collects through its website forms, how it is used and how to contact us.'
  when 'request-demo' then 'Book an operations audit of AETHER-TRADE. No account required — tell us about your trade operations and what you want to improve.'
  when 'services' then 'Operations assessments, workflow automation builds, custom AI agents, systems integration and pilot support for trade businesses.'
  when 'solutions' then 'Solutions for importers, exporters, freight forwarders, logistics operators and trading companies.'
  when 'terms' then 'Terms governing access to and use of the AETHER-TRADE website and inquiry forms.'
  else seo_description end,
noindex = case when slug = 'about' then true else noindex end
where module = 'pages'
  and publication = 'Published';