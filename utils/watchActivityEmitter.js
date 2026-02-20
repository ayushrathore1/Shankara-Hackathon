/**
 * Watch Activity Emitter — SSE pub/sub for real-time YouTube activity updates
 * Used by YouTubeHistoryService to push updates, consumed by SSE endpoint
 */
const EventEmitter = require('events');

const watchActivityEmitter = new EventEmitter();
watchActivityEmitter.setMaxListeners(100);

module.exports = watchActivityEmitter;
