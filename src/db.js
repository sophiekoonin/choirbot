const Firestore = require('@google-cloud/firestore')

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
})

const setDbValue = async (collection, docName, value) =>
  await db
    .collection(collection)
    .doc(docName)
    .set(value)

const updateDbValue = async (collection, docName, value) =>
  await db
    .collection(collection)
    .doc(docName)
    .update(value)

const addDocument = async (collection, document) =>
  await db.collection(collection).add(document)

const getDbDoc = async function(collection, docName) {
  return await db
    .collection(collection)
    .doc(docName)
    .get()
}

const getQueryResults = async query => {
  const snapshot = await query.get()
  const results = []

  snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }))
  return results
}

const getDocData = async function(collection, docName) {
  const doc = await getDbDoc(collection, docName)
  return await doc.data()
}

const getValue = async (collection, docName, key) => {
  const doc = await getDbDoc(collection, docName)
  if (!doc.exists) {
    throw new Error(`Value not found for ${docName}-${key}`)
  } else {
    return doc.get(key)
  }
}

const getValues = async (collection, docName, keys) => {
  const doc = await getDbDoc(collection, docName)
  if (!doc.exists) {
    throw new Error(`Config not found for ${docName}`)
  } else {
    const data = doc.data()
    return keys.map(key => data[key])
  }
}

module.exports = {
  db,
  updateDbValue,
  addDocument,
  setDbValue,
  getValue,
  getValues,
  getDocData,
  getQueryResults
}
