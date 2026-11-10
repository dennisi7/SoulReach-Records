import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
const adminId = "00000000-0000-4000-8000-000000000001";
const otherId = "00000000-0000-4000-8000-000000000002";
const newRecord = `
  insert into public.evangelism_records
    (person_full_name, person_phone, student_status, residence, decision, date_reached,
     baptism_status, preferred_contact_method, evangelist_full_name, evangelist_phone,
     hall_zone, department, consent_given)
  values ('Fictional Person', '024 123 4567', 'Student', 'Trafalgar', 'New Convert', '2026-11-10',
    'Unknown / not disclosed', 'No Contact', 'Fictional Evangelist', '020 987 6543',
    'Dave', 'ROSA', true)
`;

beforeAll(async () => {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
    grant usage on schema auth to authenticated;
    insert into auth.users values ('${adminId}'), ('${otherId}');
  `);
  for (const migration of ["0001_evangelism_records.sql", "20261110155920_secure_record_submissions.sql", "20261110173500_require_record_context.sql"]) {
    await db.exec(await readFile(new URL(`../../supabase/migrations/${migration}`, import.meta.url), "utf8"));
  }
  await db.query("insert into public.approved_admins (user_id) values ($1)", [adminId]);
}, 20_000);

afterAll(() => db.close());

it("allows only the server role to use the shared submission quota", async () => {
  const hash = "a".repeat(64);
  const sql = "select public.reserve_record_submission($1) as retry";
  await db.exec("set role anon");
  await expect(db.query(sql, [hash])).rejects.toMatchObject({ code: "42501" });
  await db.exec("set role authenticated");
  await expect(db.query(sql, [hash])).rejects.toMatchObject({ code: "42501" });
  await db.exec("set role service_role");
  for (let attempt = 0; attempt < 5; attempt++) {
    expect((await db.query(sql, [hash])).rows).toEqual([{ retry: 0 }]);
  }
  const blocked = await db.query<{ retry: number }>(sql, [hash]);
  expect(blocked.rows[0].retry).toBeGreaterThan(0);
  expect(blocked.rows[0].retry).toBeLessThanOrEqual(600);
  expect((await db.query(sql, ["b".repeat(64)])).rows).toEqual([{ retry: 0 }]);
  await db.exec("reset role");
});

it("requires the contact and ministry context fields", async () => {
  await db.exec("set role service_role; begin");
  let error: unknown;
  try {
    await db.exec(`
      insert into public.evangelism_records
        (person_full_name, decision, date_reached, evangelist_full_name, consent_given)
      values ('Incomplete Person', 'New Convert', '2026-11-10', 'Incomplete Evangelist', true)
    `);
  } catch (cause) {
    error = cause;
  } finally {
    await db.exec("rollback; reset role");
  }
  expect(error).toMatchObject({ code: "23514" });
});

it("lets the server insert, blocks public access, and permits only approved admin changes", async () => {
  await db.exec("set role service_role");
  await db.exec(newRecord);
  await db.exec("set role anon");
  await expect(db.query("select * from public.evangelism_records")).rejects.toMatchObject({ code: "42501" });
  await expect(db.exec(newRecord)).rejects.toMatchObject({ code: "42501" });
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [otherId]);
  expect((await db.query("select id from public.evangelism_records")).rows).toEqual([]);
  expect((await db.query("update public.evangelism_records set contacted = true returning id")).rows).toEqual([]);
  expect((await db.query("delete from public.evangelism_records returning id")).rows).toEqual([]);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [adminId]);
  expect((await db.query("select person_full_name from public.evangelism_records")).rows).toEqual([
    { person_full_name: "Fictional Person" },
  ]);
  await expect(db.query("update public.evangelism_records set consent_given = false")).rejects.toMatchObject({ code: "42501" });
  expect((await db.query("update public.evangelism_records set contacted = true returning contacted")).rows).toEqual([{ contacted: true }]);
  expect((await db.query("delete from public.evangelism_records returning id")).rows).toHaveLength(1);
  await db.exec("reset role");
});
