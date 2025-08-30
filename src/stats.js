const { listWorks } = require('./works');

/**
 * Compute overview statistics for a user.
 * @param {string} userId
 * @returns {{totalWords:number, masteredWords:number}}
 */
function getOverview(userId) {
  const works = listWorks(userId);
  let totalWords = 0;
  let masteredWords = 0;

  works.forEach((work) => {
    totalWords += work.vocab.length;
    masteredWords += work.vocab.filter((v) => v.status === 'mastered').length;
  });

  return { totalWords, masteredWords };
}

module.exports = { getOverview };
