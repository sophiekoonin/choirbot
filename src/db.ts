import { Firestore } from '@google-cloud/firestore'

export const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
})

export const setDbValue = async (collection, docName, value) =>
  await db
    .collection(collection)
    .doc(docName)
    .set(value)

export const updateDbValue = async (collection, docName, value) =>
  await db
    .collection(collection)
    .doc(docName)
    .update(value)

export const addDocument = async (collection, document) =>
  await db.collection(collection).add(document)

export const getDbDoc = async function(collection, docName) {
  return await db
    .collection(collection)
    .doc(docName)
    .get()
}

export const getQueryResults = async query => {
  const snapshot = await query.get()
  const results = []

  snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }))
  return results
}

export const getDocData = async function(collection, docName) {
  const doc = await getDbDoc(collection, docName)
  return await doc.data()
}

export const getValue = async (collection, docName, key) => {
  const doc = await getDbDoc(collection, docName)
  if (!doc.exists) {
    throw new Error(`Value not found for ${docName}-${key}`)
  } else {
    return doc.get(key)
  }
}

export const getValues = async (collection, docName, keys) => {
  const doc = await getDbDoc(collection, docName)
  if (!doc.exists) {
    throw new Error(`Config not found for ${docName}`)
  } else {
    const data = doc.data()
    return keys.map(key => data[key])
  }
}
