const crypto = require('crypto');

const challenges = new Map();

function createChallenge(workId, userId) {
  const id = crypto.randomUUID();
  challenges.set(id, { workId, scores: new Map([[userId, null]]) });
  return { id };
}

function submitScore(id, userId, score) {
  const ch = challenges.get(id);
  if (!ch) return null;
  ch.scores.set(userId, score);
  return getChallenge(id);
}

function getChallenge(id) {
  const ch = challenges.get(id);
  if (!ch) return null;
  const scores = Array.from(ch.scores.entries()).map(([userId, score]) => ({ userId, score }));
  let winner = null;
  if (scores.length >= 2 && scores.every((s) => typeof s.score === 'number')) {
    if (scores[0].score > scores[1].score) winner = scores[0].userId;
    else if (scores[1].score > scores[0].score) winner = scores[1].userId;
  }
  return { workId: ch.workId, scores, winner };
}

function _clear() {
  challenges.clear();
}

module.exports = { createChallenge, submitScore, getChallenge, _clear };
