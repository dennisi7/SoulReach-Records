const fs = require("node:fs");
const assert = require("node:assert/strict");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

async function migrate() {
  const account = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"));
  assert.equal(account.project_id, "soulreach-records");
  const app = initializeApp({ credential: cert(account) });
  const db = getFirestore(app);
  const auth = getAuth(app);
  const source = JSON.parse(fs.readFileSync("credentials/supabase-migration.json", "utf8"));
  for (const record of source.records) {
    const ref = db.collection("evangelism_records").doc(record.id);
    // Re-running migration cannot overwrite a record changed on Firebase.
    if (!(await ref.get()).exists) await ref.create(record);
  }
  const existing = await db.collection("evangelism_records").get();
  const ids = new Set(existing.docs.map((doc) => doc.id));
  assert.ok(source.records.every((record) => ids.has(record.id)));
  for (const admin of source.admins) {
    try {
      await auth.getUser(admin.uid);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
      assert.match(admin.passwordHash, /^\$2[aby]\$/);
      const result = await auth.importUsers([{
        uid: admin.uid, email: admin.email, emailVerified: admin.emailVerified,
        passwordHash: Buffer.from(admin.passwordHash),
      }], { hash: { algorithm: "BCRYPT" } });
      assert.equal(result.failureCount, 0, "Admin account import failed");
    }
    await db.collection("approved_admins").doc(admin.uid).set({ enabled: true }, { merge: true });
  }
  console.log(JSON.stringify({ recordsVerified: source.records.length, approvedAdmins: source.admins.length }));
  await app.delete();
}

migrate().catch((error) => {
  console.error("Migration failed", error.code ?? error.message);
  process.exitCode = 1;
});
