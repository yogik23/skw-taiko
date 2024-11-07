const chalk = require('chalk');

const welcomeskw = chalk.hex('#9370DB')(`
   ███████╗██╗  ██╗██╗    ██╗
   ██╔════╝██║ ██╔╝██║    ██║
   ███████╗█████╔╝ ██║ █╗ ██║
   ╚════██║██╔═██╗ ██║███╗██║
   ███████║██║  ██╗╚███╔███╔╝
   ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ 
`);

function displayskw() {
  console.clear();
  console.log(welcomeskw);
  
  console.log(chalk.hex('#8A2BE2').bold(" ╔══════════════════════════════════════════════════════════════╗"));
  console.log(chalk.hex('#800080').bold(" ║         ≣  Fitur Autobot by SKW AIRDROP HUNTER               ║"));
  console.log(chalk.hex('#8A2BE2').bold(" ║══════════════════════════════════════════════════════════════║"));

  console.log(chalk.hex('#FFD700').bold(" ║ ➤ 1️⃣  Melakukan 72x SWAP Pemanasan                          ║"));
  console.log(chalk.hex('#00CED1').bold(" ║ ➤ 2️⃣  Melakukan SWAP hingga Daily Max Reached               ║"));
  console.log(chalk.hex('#32CD32').bold(" ║ ➤ 3️⃣  Otomatis mengulang Autobot di jam 7 Pagi              ║"));
  console.log(chalk.hex('#1E90FF').bold(" ║ ➤ 4️⃣  Pantau Status melalui Telegram                        ║"));
  console.log(chalk.hex('#FF1493').bold(" ║ ➤ 5️⃣  Dapatkan rincian (gas , berapa x swap, Point , dll)   ║"));

  console.log(chalk.hex('#FF4500').bold(" ╚══════════════════════════════════════════════════════════════╝"));
  
  console.log(chalk.hex('#FF6347').italic("   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░"));
  
}

displayskw();
