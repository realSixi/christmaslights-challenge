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
  // console.log()
  for (let i = 0; i < numberOfLeds; i++) {
    if (i % 5 == Math.floor((inc / 10) % 5)) {
      let x = map_range((inc / 20) % 1000, 0, 1000, 0, 360);
      colors[i] = hsv2rgb(x, 100, 5);
    } else {
      colors[i] = 0;
    }
  }

  // let c1 = Math.floor(map_range(Math.sin(inc / 100), -1, 1, 0, numberOfLeds));
  // colors[c1] = hsv2rgb(color, 100, 20);

  // let c2 = Math.floor(map_range(Math.sin((inc + 20) / 100), -1, 1, 0, numberOfLeds));
  // colors[c2] = hsv2rgb(color, 100, 20);

  for (let i = 0; i < 100; i += 20) {
    let c2 = Math.floor(
      map_range(Math.sin((inc + i) / 100), -1, 1, 0, numberOfLeds)
    );
    colors[c2] = hsv2rgb((color + 2 * i) % 360, 100, 100);
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
    setTimeout(refreshColors, 1000 / 60);
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
