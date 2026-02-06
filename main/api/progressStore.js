const store = new Map();

function init(requestId, meta = {}) {
  if (!requestId) return;
  store.set(requestId, {
    requestId,
    createdAt: new Date().toISOString(),
    meta,
    lastEvent: null,
    done: null,
  });
}

function updateProgress(requestId, event) {
  if (!requestId) return;
  const prev = store.get(requestId) || { requestId, createdAt: new Date().toISOString() };
  store.set(requestId, {
    ...prev,
    lastEvent: event || prev.lastEvent || null,
  });
}

function markDone(requestId, done) {
  if (!requestId) return;
  const prev = store.get(requestId) || { requestId, createdAt: new Date().toISOString() };
  store.set(requestId, {
    ...prev,
    done: done || prev.done || null,
  });
}

function get(requestId) {
  if (!requestId) return null;
  return store.get(requestId) || null;
}

module.exports = {
  init,
  updateProgress,
  markDone,
  get,
};
