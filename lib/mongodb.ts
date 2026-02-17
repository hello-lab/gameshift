"use server";
import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not set");
}
console.log(mongoUri)
function getClientPromise() {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(mongoUri, {
      tlsAllowInvalidCertificates: process.env.NODE_ENV !== "production",
    });
    global._mongoClientPromise = client.connect();
  }

  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB || "gameshift";
  return client.db(dbName);
}

export async function ensureUserIndexes(db: Db) {
  const users = db.collection("users");
  await users.createIndex({ emailLower: 1 }, { unique: true });
  await users.createIndex({ usernameLower: 1 }, { unique: true });
}

export async function ensureTeamIndexes(db: Db) {
  const teams = db.collection("teams");
  await teams.createIndex({ inviteCode: 1 }, { unique: true });
  await teams.createIndex({ leaderId: 1 });
}
