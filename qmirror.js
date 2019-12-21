const MQTT = require('mqtt');
const Hypercore = require('hypercore');
const Pino = require('pino');
const LRU = require('lru-cache');

const server = 'ws://localhost:8883';
const announce = 'qmirror/announce';
const log = new Pino();
const cache = new LRU({
  max: 100,
  dispose: (key, feed) => { feed.close(); }
});

function getFeed(topic) {
  if (cache.has(topic)) {
    return cache.get(topic)
  } else {
    let feed = Hypercore(`./data/${encodeURIComponent(topic)}`);
    cache.set(topic, feed);
    setInterval(() => { feed.flush(); }, 1000);
    return feed;
  }
}

let client = MQTT.connect(server);

client.on('connect', () => {
  log.info(`connected to mqtt broker ${server}; subscribing to announcements on ${announce}`);
  client.subscribe(announce, { qos: 2 });
});

client.on('message', (topic, payload, _) => {
  if (topic === announce) {
    let topic = payload.toString();
    log.info(`subscribing to announced channel ${topic}`);
    client.subscribe(topic, { qos: 1 });
    let feed = getFeed(topic);
    feed.ready(() => {
      let feedKey = feed.key.toString('hex');
      log.info(`adding feed ${feedKey} for topic ${topic}`);
    });
  } else {
    let feed = getFeed(topic);
    feed.ready(() => {
      feed.append(payload, (err, seq) => {
	if (err) log.error(err);
	log.debug(`added entry ${seq} for topic ${topic}`);
      });
    });
  }
});
