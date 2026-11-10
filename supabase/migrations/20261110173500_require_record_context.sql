begin;

alter table public.evangelism_records
  alter column consent_given set default true,
  alter column consent_notice_version set default 'pre-form-v1';

alter table public.evangelism_records
  add constraint evangelism_records_person_phone_required
    check (person_phone is not null and btrim(person_phone) <> '') not valid,
  add constraint evangelism_records_student_status_required
    check (student_status in ('Student', 'Non-student')) not valid,
  add constraint evangelism_records_residence_required
    check (residence is not null and btrim(residence) <> '') not valid,
  add constraint evangelism_records_baptism_status_check
    check (baptism_status in ('Yes', 'No', 'Unknown / not disclosed')) not valid,
  add constraint evangelism_records_preferred_contact_method_check
    check (preferred_contact_method in ('Phone call', 'WhatsApp', 'SMS', 'No Contact')) not valid,
  add constraint evangelism_records_evangelist_phone_required
    check (evangelist_phone is not null and btrim(evangelist_phone) <> '') not valid,
  add constraint evangelism_records_hall_zone_required
    check (hall_zone is not null and btrim(hall_zone) <> '') not valid,
  add constraint evangelism_records_department_required
    check (department is not null and btrim(department) <> '') not valid;

commit;
