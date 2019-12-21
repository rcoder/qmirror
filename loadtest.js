const MQTT = require('mqtt');
const crypto = require('crypto');

const client = MQTT.connect('mqtt://localhost');
const topic = '_test/load';
const maxRps = 1000;

let sent = 0;
let bytes = 0;
const start = process.hrtime();

client.on('connect', () => {
  client.publish('qmirror/announce', Buffer.from(topic), { qos: 2 });
  console.log(`connected to mqtt broker + published ${topic} channel announcement`);
  setInterval(() => {
    let msg = JSON.stringify({
      date: new Date(),
      msg: 'hello',
      uptime: process.uptime(),
      random: crypto.randomBytes(128).toString('base64')
    });
    client.publish(topic, Buffer.from(msg), { qos: 1 }, (err) => {
      if (err) console.log(err);
      sent += 1;
      bytes += msg.length;
    });
  }, 1000/maxRps);
});

process.on('SIGINT', () => {
  let [secs, nanos] = process.hrtime(start);
  let tm = secs + nanos / 1e9;
  console.log(`\nran for ${tm}s`);
  console.log(`sent ${sent} messages totaling ${bytes / 1000} kB`);
  console.log(`(${sent / tm} msg/s, ${bytes / (tm * 1000)} kB/s)`);
  client.end();
  process.exit();
});
