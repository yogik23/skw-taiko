const chalk = require('chalk');

const welcomeskw = `
   ███████╗██╗  ██╗██╗    ██╗
   ██╔════╝██║ ██╔╝██║    ██║
   ███████╗█████╔╝ ██║ █╗ ██║
   ╚════██║██╔═██╗ ██║███╗██║
   ███████║██║  ██╗╚███╔███╔╝
   ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ 
                          
`;

function displayskw() {
  console.log(welcomeskw);
  console.log(chalk.hex('#ffb347')(`Fitur Autobot by SKW AIRDROP HUNTER`));
  console.log(chalk.hex('#90ee90')('1. Melakukan 2x SWAP untuk mendapatkan point baru'));
  console.log(chalk.hex('#90ee90')('2. Melakukan SWAP hingga Daily Max Reached'));
  console.log(chalk.hex('#90ee90')('3. Otomatis mengulang Autobot dijam 7 Pagi'));
  console.log(chalk.hex('#90ee90')('4. Pantau Status melalui Telegram'));
  console.log(chalk.hex('#90ee90')('5. Dapatkan rincian (gas yang dipakai, berapa x swap, Point di web, dll)'));
}

module.exports = displayskw;
