import { Query } from '@google-cloud/firestore'
import { db } from './db'

export const setDbValue = async (
  collection: string,
  docName: string,
  value: FirebaseFirestore.DocumentData
) => await db.collection(collection).doc(docName).set(value)

export const updateDbValue = async (
  collection: string,
  docName: string,
  value: FirebaseFirestore.DocumentData
) => await db.collection(collection).doc(docName).update(value)

export const getDbDoc = async function (collection: string, docName: string) {
  return await db.collection(collection).doc(docName).get()
}

interface QueryResult {
  id: string
  [key: string]: string | number | string[]
}

export async function getQueryResults(query: FirebaseFirestore.Query) {
  const snapshot = await query.get()
  const results: QueryResult[] = []

  snapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() }))
  return results
}

export async function getDocData(collection: string, docName: string) {
  const doc = await getDbDoc(collection, docName)
  return doc.data()
}

export async function getValue(
  collection: string,
  docName: string,
  key: string
) {
  const doc = await getDbDoc(collection, docName)
  if (!doc.exists) {
    throw new Error(`Value not found for ${docName}-${key}`)
  } else {
    return doc.get(key)
  }
}

export const getValues = async (
  collection: string,
  docName: string,
  keys: string[]
): Promise<{ [key: string]: string | number | string[] | boolean }> => {
  const doc = await getDbDoc(collection, docName)
  if (!doc.exists) {
    throw new Error(`Doc not found for ${docName}`)
  } else {
    const data = doc.data()
    return keys
      .map((key) => ({ [key]: data[key] }))
      .reduce((acc, curr) => {
        return { ...acc, ...curr }
      }, {})
  }
}

export async function deleteCollection(
  collectionPath: string,
  batchSize: number
) {
  const collectionRef = db.collection(collectionPath)
  const query = collectionRef.orderBy('__name__').limit(batchSize)
  try {
    return await deleteQueryBatch(query, batchSize)
  } catch (err) {
    console.error(`Error deleting collection ${collectionPath}`, err)
  }
}

async function deleteQueryBatch(query: Query, batchSize: number) {
  const snapshot = await query.get()
  // When there are no documents left, we are done
  if (snapshot.size === 0) {
    return 0
  }
  // Delete documents in a batch
  const batch = db.batch()
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })

  await batch.commit()

  if (snapshot.size === 0) {
    return
  }

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(query, batchSize)
  })
}
