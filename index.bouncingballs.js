const e131 = require('e131');
const config = require('./config');

const {numberOfLeds} = require('./config');
const {hsv2rgb, delay} = require('./helper');

const client = new e131.Client(config.ip); // or use a universe
const packet = client.createPacket(config.numberOfLeds * 3); // we want 8 RGB (x3) slots
const slotsData = packet.getSlotsData();
packet.setSourceName('test E1.31 client');
packet.setUniverse(0x01); // make universe number consistent with the client
packet.setOption(packet.Options.PREVIEW, true); // don't really change any fixture
packet.setPriority(packet.DEFAULT_PRIORITY); // not strictly needed, done automatically

const map_range = (value, low1, high1, low2, high2) =>
  low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);

const colors = Array(numberOfLeds).fill(0);

let delta = 360 / numberOfLeds; // delta to fill the whole strip with a rainbow
let inc = 0;
let color = 0;

async function loop() {
  for (let i = 0; i < numberOfLeds; i++) {
    if (i % 3 == Math.floor((inc / 10) % 3)) {
      let x = map_range((inc / 20) % 1000, 0, 1000, 0, 360);
      colors[i] = hsv2rgb(0, map_range(i, 0, numberOfLeds, 200, 0), 5);
    } else {
      colors[i] = 0;
    }
  }


  for (let i = 0; i < 100; i += 10) {
    let c2 = Math.floor(
      map_range(Math.sin((inc + i) / 100), -1, 1, -10, numberOfLeds + 1)
    );
    colors[c2] = hsv2rgb((color + 4 * i) % 360, 100, 100);
  }

  color = (color + 1) % 360;
  inc++;
  await delay(10);
}

// ---------------------------------------
// just leave the stuff below as is is ;)
// ---------------------------------------

/**
 * syncs the color-array with e131 at 60fps
 */
function refreshColors() {
  for (let idx = 0; idx < config.numberOfLeds; idx++) {
    slotsData[idx * 3 + 2] = colors[idx] & 0xff;
    slotsData[idx * 3 + 1] = (colors[idx] >> 8) & 0xff;
    slotsData[idx * 3 + 0] = (colors[idx] >> 16) & 0xff;
  }

  client.send(packet, function () {
    setTimeout(refreshColors, 1000 / 30);
  });
}
refreshColors();

/**
 * run the loop function forever and ever and ever and.... until we reached eternity
 */
const runLoop = async () => {
  loop().then(() => {
    setTimeout(runLoop, 0);
  });
};
runLoop();
