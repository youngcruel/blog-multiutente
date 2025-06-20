import Tag from '../models/Tag.js';

/**
 * Accetta un array di nomi tag e restituisce un array di ObjectId dei tag trovati o creati
 * @param {string[]} tagNames
 * @returns {Promise<ObjectId[]>}
 */
export async function findOrCreateTags(tagNames) {
  const tags = await Promise.all(tagNames.map(async (name) => {
    const tagName = name.trim().toLowerCase();
    let tag = await Tag.findOne({ name: tagName });
    if (!tag) {
      tag = await Tag.create({ name: tagName });
    }
    return tag._id;
  }));

  return tags;
}