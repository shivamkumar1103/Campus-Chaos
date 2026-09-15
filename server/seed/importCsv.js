/**
 * Import users.csv + lostfounditems.csv into MongoDB.
 *
 * Usage (from server/ folder):
 *   node seed/importCsv.js                  # clears + imports defaults
 *   node seed/importCsv.js --no-clear        # keep existing data, skip duplicates by _id/email
 *   node seed/importCsv.js --dry-run         # parse + validate only, no DB connection
 *   node seed/importCsv.js --users=seed/users.csv --items=seed/lostfounditems.csv
 *
 * Env:
 *   MONGO_URI is read from server/.env (see .env.example)
 *
 * Notes:
 * - Only uses built-in modules + mongoose (no extra npm install).
 * - users.csv passwords are already bcrypt-hashed, so they are inserted via
 *   the native collection to bypass the User pre('save') re-hash hook.
 *   Plain-text passwords (if you add your own rows) are created via
 *   User.create() so they get hashed normally.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const DEFAULT_USERS_CSV = path.join(__dirname, "users.csv");
const DEFAULT_ITEMS_CSV = path.join(__dirname, "lostfounditems.csv");

function parseArgs(argv) {
  const opts = { clear: true, dryRun: false, users: DEFAULT_USERS_CSV, items: DEFAULT_ITEMS_CSV };
  for (const a of argv.slice(2)) {
    if (a === "--no-clear") opts.clear = false;
    else if (a === "--clear") opts.clear = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a.startsWith("--users=")) opts.users = path.resolve(a.slice("--users=".length));
    else if (a.startsWith("--items=")) opts.items = path.resolve(a.slice("--items=".length));
    else if (a === "--help" || a === "-h") {
      console.log(fs.readFileSync(__filename, "utf8").match(/\/\*\*([\s\S]*?)\*\//)[1]);
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}\nUse --help for usage.`);
      process.exit(1);
    }
  }
  return opts;
}

// Minimal CSV parser: handles quoted fields with commas/escaped quotes.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip, handled by \n
    } else {
      field += c;
    }
  }
  // trailing field
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // drop empty trailing lines
  while (rows.length && rows[rows.length - 1].every((v) => v.trim() === "")) rows.pop();
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    return obj;
  });
}

const isBcryptHash = (s) => /^\$2[aby]\$\d{2}\$.{53}$/.test(s || "");
const toObjectId = (s, field, rowId) => {
  if (!s) return undefined;
  if (!mongoose.Types.ObjectId.isValid(s)) {
    throw new Error(`Invalid ObjectId in ${field}="${s}" (row _id=${rowId})`);
  }
  return new mongoose.Types.ObjectId(s);
};
const toDate = (s, field, rowId) => {
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date in ${field}="${s}" (row _id=${rowId})`);
  return d;
};

function buildUsers(rows) {
  return rows.map((r) => {
    if (!r.email) throw new Error(`User row missing email (_id=${r._id})`);
    const doc = {
      ...(r._id ? { _id: toObjectId(r._id, "_id", r._id) } : {}),
      name: r.name,
      email: r.email.toLowerCase(),
      password: r.password,
      role: r.role || "student",
      ...(r.usn ? { usn: r.usn } : {}),
      ...(r.department ? { department: r.department } : {}),
      avatar: r.avatar || "",
    };
    const createdAt = toDate(r.createdAt, "createdAt", r._id);
    const updatedAt = toDate(r.updatedAt, "updatedAt", r._id);
    if (createdAt || updatedAt) {
      doc.$timestamps = { createdAt, updatedAt };
    }
    return doc;
  });
}

function buildItems(rows) {
  return rows.map((r) => {
    if (!r.title || !r.description || !r.type) {
      throw new Error(`Item row missing title/description/type (_id=${r._id})`);
    }
    const doc = {
      ...(r._id ? { _id: toObjectId(r._id, "_id", r._id) } : {}),
      title: r.title,
      description: r.description,
      type: r.type,
      category: r.category || "other",
      location: r.location || "",
      locationFound: r.locationFound || "",
      ...(r.date ? { date: toDate(r.date, "date", r._id) } : {}),
      imageUrl: r.imageUrl || "",
      status: r.status || "open",
      reportedBy: toObjectId(r.reportedBy, "reportedBy", r._id),
      claimantId: r.claimantId ? toObjectId(r.claimantId, "claimantId", r._id) : null,
      claimProof: r.claimProof || "",
    };
    const createdAt = toDate(r.createdAt, "createdAt", r._id);
    const updatedAt = toDate(r.updatedAt, "updatedAt", r._id);
    if (createdAt || updatedAt) {
      doc.$timestamps = { createdAt, updatedAt };
    }
    return doc;
  });
}

async function main() {
  const opts = parseArgs(process.argv);

  for (const [label, p] of [
    ["users", opts.users],
    ["items", opts.items],
  ]) {
    if (!fs.existsSync(p)) {
      console.error(`Missing ${label} CSV: ${p}`);
      process.exit(1);
    }
  }

  const userRows = parseCSV(fs.readFileSync(opts.users, "utf8"));
  const itemRows = parseCSV(fs.readFileSync(opts.items, "utf8"));
  console.log(`Parsed ${userRows.length} users from ${opts.users}`);
  console.log(`Parsed ${itemRows.length} items from ${opts.items}`);

  const userDocs = buildUsers(userRows);
  const itemDocs = buildItems(itemRows);

  // Validate with Mongoose schemas before touching the DB.
  // eslint-disable-next-line global-require
  const User = require("../models/User");
  // eslint-disable-next-line global-require
  const LostFoundItem = require("../models/LostFoundItem");
  for (const u of userDocs) {
    const err = new User({ ...u, $timestamps: undefined }).validateSync();
    if (err) throw new Error(`User validation failed (${u.email}): ${err.message}`);
  }
  for (const it of itemDocs) {
    const err = new LostFoundItem({ ...it, $timestamps: undefined }).validateSync();
    if (err) throw new Error(`Item validation failed (${it._id}): ${err.message}`);
  }
  const userIds = new Set(userDocs.map((u) => String(u._id || "")));
  for (const it of itemDocs) {
    if (it.reportedBy && !userIds.has(String(it.reportedBy))) {
      console.warn(`Warning: item ${it._id} reportedBy ${it.reportedBy} not in users.csv`);
    }
    if (it.claimantId && !userIds.has(String(it.claimantId))) {
      console.warn(`Warning: item ${it._id} claimantId ${it.claimantId} not in users.csv`);
    }
  }
  console.log("Validation OK.");

  if (opts.dryRun) {
    console.log("Dry run — nothing written to DB.");
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Set MONGO_URI in server/.env first (see .env.example).");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log(`Connected to ${mongoose.connection.name}`);

  // eslint-disable-next-line global-require
  const UserM = require("../models/User");
  // eslint-disable-next-line global-require
  const ItemM = require("../models/LostFoundItem");

  if (opts.clear) {
    const [du, di] = await Promise.all([UserM.deleteMany({}), ItemM.deleteMany({})]);
    console.log(`Cleared ${du.deletedCount} users, ${di.deletedCount} items.`);
  }

  // Users: hashed passwords must bypass pre('save') or they'd get double-hashed.
  const hashed = [];
  const plain = [];
  for (const u of userDocs) (isBcryptHash(u.password) ? hashed : plain).push(u);

  let insertedUsers = 0;
  if (hashed.length) {
    const withTs = hashed.map((u) => {
      const { $timestamps, ...rest } = u;
      return {
        ...rest,
        createdAt: ($timestamps && $timestamps.createdAt) || new Date(),
        updatedAt: ($timestamps && $timestamps.updatedAt) || new Date(),
      };
    });
    if (opts.clear) {
      const res = await UserM.collection.insertMany(withTs, { ordered: false });
      insertedUsers += res.insertedCount;
    } else {
      // skip docs that already exist by _id or email
      let skipped = 0;
      for (const doc of withTs) {
        const exists = await UserM.exists({
          $or: [{ _id: doc._id }, { email: doc.email }],
        });
        if (exists) {
          skipped++;
          continue;
        }
        await UserM.collection.insertOne(doc);
        insertedUsers++;
      }
      if (skipped) console.log(`Skipped ${skipped} existing users.`);
    }
  }
  for (const u of plain) {
    const { $timestamps, ...rest } = u; // let Mongoose hash + timestamp these
    if (opts.clear) {
      await UserM.create(rest);
    } else {
      await UserM.updateOne({ email: rest.email }, { $setOnInsert: rest }, { upsert: true });
    }
    insertedUsers++;
  }
  console.log(`Users up: ${insertedUsers} (${hashed.length} pre-hashed, ${plain.length} plain→hashed).`);

  const withTsItems = itemDocs.map((it) => {
    const { $timestamps, ...rest } = it;
    return {
      ...rest,
      createdAt: ($timestamps && $timestamps.createdAt) || new Date(),
      updatedAt: ($timestamps && $timestamps.updatedAt) || new Date(),
    };
  });
  let insertedItems = 0;
  if (opts.clear) {
    const res = await ItemM.collection.insertMany(withTsItems, { ordered: false });
    insertedItems = res.insertedCount;
  } else {
    let skipped = 0;
    for (const doc of withTsItems) {
      const exists = await ItemM.exists({ _id: doc._id });
      if (exists) {
        skipped++;
        continue;
      }
      await ItemM.collection.insertOne(doc);
      insertedItems++;
    }
    if (skipped) console.log(`Skipped ${skipped} existing items.`);
  }
  console.log(`Items up: ${insertedItems}.`);
  console.log("Done. Verify: db.users.countDocuments() / db.lostfounditems.countDocuments()");
}

main()
  .catch((e) => {
    console.error("Import failed:", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });
