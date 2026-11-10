-- Add editable, illustrative homepage workflow demos without touching existing content records.
begin;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'content_records'
      and policyname = 'Public can read published workflow demos'
  ) then
    create policy "Public can read published workflow demos"
      on public.content_records for select to anon, authenticated
      using (
        module = 'workflow'
        and publication = 'Published'::publication_status
        and coalesce(noindex, false) = false
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'content_records'
      and policyname = 'Public can read due scheduled workflow demos'
  ) then
    create policy "Public can read due scheduled workflow demos"
      on public.content_records for select to anon, authenticated
      using (
        module = 'workflow'
        and publication = 'Scheduled'::publication_status
        and scheduled_at is not null
        and scheduled_at <= now()
        and coalesce(noindex, false) = false
      );
  end if;
end
$$;

insert into public.content_records
  (module, slug, title, body, category, fields, publication, availability, position, noindex)
values
(
  'workflow',
  'document-reconciliation',
  'Document Reconciliation',
  'Illustrative demonstration. Sample data only; not a live integration.',
  'Illustrative workflow',
  jsonb_build_object('workflowConfig', $document_reconciliation$
  {
    "steps": [
      {"id":1,"label":"Shipment email received","icon":"Inbox"},
      {"id":2,"label":"Documents collected","icon":"Files"},
      {"id":3,"label":"Document types identified","icon":"ScanSearch"},
      {"id":4,"label":"Information extracted","icon":"ListTree"},
      {"id":5,"label":"Shipment data structured","icon":"Table2"},
      {"id":6,"label":"Documents compared","icon":"GitCompareArrows"},
      {"id":7,"label":"Findings & evidence","icon":"ClipboardCheck"},
      {"id":8,"label":"Human review & workpaper","icon":"UserCheck"}
    ],
    "exceptionSteps":[2,5,6,7,8],
    "exceptionEntryLabel":"Missing or conflicting information?",
    "exceptionEntryHint":"See the exception branch",
    "standardPanels":[
      {"step":1,"type":"inbox","title":"inbox · shipment@forwarder","subject":"Shipment update — Booking REF-2081","time":"09:41","body":"Please find attached the document set for the upcoming departure.","attachments":["Commercial Invoice.pdf","Packing List.pdf","Bill of Lading.pdf"]},
      {"step":2,"type":"list","title":"case REF-2081 · document tray","items":[
        {"label":"Commercial Invoice.pdf","value":"Received","tone":"success"},
        {"label":"Packing List.pdf","value":"Received","tone":"success"},
        {"label":"Bill of Lading.pdf","value":"Received","tone":"success"}
      ]},
      {"step":3,"type":"classification","title":"classification · detected types","items":[
        {"label":"File A.pdf","value":"Commercial invoice · High confidence","tone":"primary"},
        {"label":"File B.pdf","value":"Packing list · High confidence","tone":"primary"},
        {"label":"File C.pdf","value":"Bill of lading · High confidence","tone":"primary"}
      ]},
      {"step":4,"type":"fields","title":"extraction · available fields","rows":[
        {"label":"Shipper","value":"Pacific Components Ltd."},
        {"label":"Consignee","value":"Meridian Trading GmbH"},
        {"label":"Container","value":"MSCU 4821 093-7"},
        {"label":"Gross weight","value":"18,420 kg"},
        {"label":"Port of loading","value":"Jebel Ali"},
        {"label":"Port of discharge","value":"Hamburg"},
        {"label":"Incoterm","value":"FOB"}
      ],"note":"Sample data for illustration only."},
      {"step":5,"type":"fields","title":"case REF-2081 · structured shipment","rows":[
        {"label":"Case","value":"REF-2081"},
        {"label":"Route","value":"Jebel Ali → Hamburg"},
        {"label":"Documents linked","value":"3 of 3 expected"},
        {"label":"Fields captured","value":"34 fields"},
        {"label":"Case status","value":"Ready for comparison"}
      ]},
      {"step":6,"type":"table","title":"comparison · cross-document","columns":["Field","Invoice","Packing list","Status"],"tableRows":[
        {"cells":["Container","MSCU 4821 093-7","MSCU 4821 093-7","MATCH"],"ok":true},
        {"cells":["Gross weight","18,420 kg","18,420 kg","MATCH"],"ok":true},
        {"cells":["Quantity","1,200 units","1,180 units","MISMATCH"],"ok":false},
        {"cells":["Origin","Jebel Ali","Jebel Ali","MATCH"],"ok":true}
      ]},
      {"step":7,"type":"alert","title":"findings · evidence-backed","heading":"Quantity mismatch between commercial invoice and packing list","body":"Invoice states 1,200 units; packing list states 1,180 units. Human review required before any action is taken.","evidence":["Evidence · invoice p.1","Evidence · packing list p.1"],"note":"Findings are presented with references so reviewers can verify every conclusion. A discrepancy is a review finding, not an automatic decision."},
      {"step":8,"type":"review","title":"review · workpaper REF-2081","items":[
        {"label":"Field comparison completed","value":"3 matched · 1 flagged"},
        {"label":"Finding raised","value":"Quantity mismatch — evidence attached"},
        {"label":"Reviewer decision","value":"Pending"}
      ],"actions":["CONFIRM","ADJUST","REQUEST DOCUMENTS"],"note":"Authorized staff make the consequential decision; the system organizes the evidence."}
    ],
    "exceptionPanels":[
      {"step":2,"type":"list","title":"case REF-2081 · document tray","items":[
        {"label":"Commercial Invoice.pdf","value":"Received","tone":"success"},
        {"label":"Packing List.pdf","value":"Not received","tone":"warning"},
        {"label":"Bill of Lading.pdf","value":"Received","tone":"success"}
      ],"note":"EXCEPTION · Expected document missing from the set."},
      {"step":5,"type":"fields","title":"case REF-2081 · structured shipment","rows":[
        {"label":"Case","value":"REF-2081"},
        {"label":"Route","value":"Jebel Ali → Hamburg"},
        {"label":"Documents linked","value":"2 of 3 expected"},
        {"label":"Case status","value":"On hold — clarification requested"}
      ]},
      {"step":6,"type":"alert","title":"exception · comparison unavailable","heading":"Cross-document comparison paused — packing list not received","body":"The case is held rather than reviewed against incomplete information."},
      {"step":7,"type":"message","title":"findings · clarification requested","heading":"Follow-up prepared for approval","body":"“Could you share the packing list for booking REF-2081? The document set appears incomplete.”","note":"Messages are prepared for your team to review and send — nothing is sent automatically without approval."},
      {"step":8,"type":"review","title":"review · workpaper REF-2081","items":[
        {"label":"Field comparison","value":"Paused"},
        {"label":"Finding raised","value":"Expected document missing"},
        {"label":"Reviewer decision","value":"Pending"}
      ],"actions":["REVIEW","REQUEST DOCUMENTS"],"note":"Authorized staff review the incomplete document set."}
    ]
  }
  $document_reconciliation$::jsonb),
  'Published',
  'Available',
  0,
  false
),
(
  'workflow',
  'shipment-follow-up',
  'Shipment Follow-Up',
  'Illustrative demonstration. Sample data only; not a live integration.',
  'Illustrative workflow',
  jsonb_build_object('workflowConfig', $shipment_follow_up$
  {
    "steps": [
      {"id":1,"label":"Request sent","icon":"Send"},
      {"id":2,"label":"Reply received","icon":"Inbox"},
      {"id":3,"label":"Gap detected","icon":"Files"},
      {"id":4,"label":"Age checked","icon":"Clock"},
      {"id":5,"label":"Follow-up drafted","icon":"MailCheck"},
      {"id":6,"label":"Human review","icon":"UserCheck"},
      {"id":7,"label":"Approved and sent","icon":"CheckCircle2"},
      {"id":8,"label":"Logged on the case","icon":"ClipboardList"}
    ],
    "exceptionSteps":[2,3,6,8],
    "exceptionEntryLabel":"Conflicting booking information?",
    "exceptionEntryHint":"See the exception branch",
    "standardPanels":[
      {"step":1,"type":"fields","title":"request · REF-2081","rows":[
        {"label":"Action","value":"Team requested the full document set"},
        {"label":"Booking reference","value":"REF-2081"},
        {"label":"Request status","value":"Sent"}
      ]},
      {"step":2,"type":"inbox","title":"inbox · shipment@forwarder","subject":"Shipment update, Booking REF-2081","time":"09:41","body":"Please find attached the document set for the upcoming departure.","attachments":["Commercial Invoice.pdf","Bill of Lading.pdf"]},
      {"step":3,"type":"list","title":"case REF-2081 · document checklist","items":[
        {"label":"Commercial Invoice.pdf","value":"Received","tone":"success"},
        {"label":"Bill of Lading.pdf","value":"Received","tone":"success"},
        {"label":"Packing List.pdf","value":"Missing","tone":"warning"}
      ],"note":"The assistant identifies the missing item from the expected document set."},
      {"step":4,"type":"fields","title":"follow-up threshold · REF-2081","rows":[
        {"label":"Request age","value":"2 days"},
        {"label":"Follow-up threshold","value":"2 days"},
        {"label":"Threshold result","value":"Passed","tone":"success"}
      ]},
      {"step":5,"type":"message","title":"draft · supplier follow-up","heading":"Reminder prepared for review","body":"Hello, thank you for the documents on REF-2081. We have the Commercial Invoice and Bill of Lading, but we are still missing the Packing List. Could you please send it today so we can keep the departure on schedule? Thank you.","note":"Draft only. The coordinator must review and approve the message before it is sent."},
      {"step":6,"type":"review","title":"human review · coordinator","items":[
        {"label":"Draft status","value":"Ready for review"},
        {"label":"Reviewer","value":"Coordinator"},
        {"label":"Send permission","value":"Not approved yet","tone":"warning"}
      ],"note":"The coordinator reads the reminder on screen. Nothing has been sent at this stage."},
      {"step":7,"type":"message","title":"approval · REF-2081","heading":"Coordinator approved the reminder","body":"The coordinator approves the prepared message. The illustrative workflow now records the message as sent.","status":"APPROVED BY COORDINATOR · SENT"},
      {"step":8,"type":"timeline","title":"case activity · REF-2081","items":[
        {"label":"Follow-up sent","value":"09:52 · sample timestamp","tone":"success"},
        {"label":"Case tracking","value":"Open — awaiting Packing List","tone":"warning"}
      ],"note":"The send is recorded with date and time. The request remains tracked until the document arrives."}
    ],
    "exceptionPanels":[
      {"step":2,"type":"inbox","title":"inbox · shipment@forwarder","subject":"Supplier reply, Booking REF-2081","time":"09:41","body":"Supplier reply received with a document that needs to be checked against the booking details.","attachments":["Bill of Lading.pdf"]},
      {"step":3,"type":"alert","title":"exception · booking detail conflict","heading":"Conflict detected in the received document","body":"The document conflicts with the booking details. No reminder is sent. The case is routed to a coordinator for review.","evidence":["Bill of Lading.pdf · document reference"]},
      {"step":6,"type":"review","title":"coordinator review · REF-2081","items":[
        {"label":"Conflict status","value":"Pending coordinator review","tone":"warning"},
        {"label":"Reminder status","value":"Not sent","tone":"success"},
        {"label":"Next action","value":"Coordinator resolves the conflict"}
      ],"note":"The workflow pauses until the coordinator reviews the referenced document."},
      {"step":8,"type":"timeline","title":"case activity · REF-2081","items":[
        {"label":"Conflict logged","value":"Document reference attached","tone":"warning"},
        {"label":"Reminder status","value":"Not sent","tone":"success"},
        {"label":"Case status","value":"Awaiting coordinator review"}
      ]}
    ]
  }
  $shipment_follow_up$::jsonb),
  'Published',
  'Available',
  1,
  false
)
on conflict (module, slug) do nothing;

commit;
