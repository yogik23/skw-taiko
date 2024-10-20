const axios = require('axios');
const Web3 = require('web3');
const swap_ABI = require('./weth_abi');
const chalk = require('chalk');
const figlet = require('figlet');
const cron = require('node-cron');
const readline = require('readline');
const displayskw = require('./welcomeskw');
const TelegramBot = require('node-telegram-bot-api');

require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const chatId = process.env.TELEGRAM_CHAT_ID;

const rpcUrl = process.env.RPC_URL;
const privateKey = process.env.WALLET_PRIVATEKEY;
const wethCA = process.env.WETH_CA;

const web3 = new Web3(rpcUrl);
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);

const wethContract = new web3.eth.Contract(swap_ABI, wethCA);

let totalAmountDeposited = 0;
let totalAmountWithdrew = 0;
let totalGasSpent = 0;
let totalWETHBalance = 0;
let totalDepositCount = 0;
let totalWithdrawCount = 0;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function autobot() {
    console.clear();
    rl.question(chalk.hex(`#add8e6`)('Apa yang ingin Anda lakukan?\n1. Swap menggunakan cron otomatis tiap hari\n2. Swap tanpa cron, berhenti ketika selesai\n3. Langsung swap tanpa 2x tx\n4. ETH Gratis dari Prabowo\nPilih (1/2/3/4): '), (answer) => {
        switch(answer) {
            case '1':
                main();
                break;
            case '2':
                startautobot();
                break;
            case '3':
                startBotSKW();
                break;
            case '4':
                console.log(chalk.red(`FUCK MAKAN GRATIS`));
                console.log(chalk.red(`FUCK MAKAN GRATIS`));
                console.log(chalk.yellow(`FUCK MAKAN GRATIS`));
                console.log(chalk.yellow(`FUCK MAKAN GRATIS`));
                console.log(chalk.green(`FUCK MAKAN GRATIS`));
                console.log(chalk.green(`FUCK MAKAN GRATIS`));    
                process.exit();
            default:
                console.log('Pilihan tidak valid. Silakan pilih 1, 2, atau 3.');
                autobot();
        }
        rl.close();
    });
}

function getRandomAmount() {
  const min = parseFloat(process.env.RANDOM_AMOUNT_MIN);
  const max = parseFloat(process.env.RANDOM_AMOUNT_MAX);
  const randomValue = Math.random() * (max - min) + min;
  return randomValue.toFixed(8).toString();
}

async function getLatestData(address) {
    try {
        const url = `https://trailblazer.mainnet.taiko.xyz/s2/user/history?address=${address}`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            }
        });

        if (response.data && response.data.items && response.data.items.length > 0) {
            const points = response.data.items.slice(0, 2).map(item => item.points);
            return points; 
        } else {
            console.log('Tidak ada items ditemukan.');
            return [null, null, null]; 
        }
    } catch (error) {
        console.error('Error saat mengambil data:', error);
        return [null, null, null]; 
    }
}

async function deposit(sendIndex, txCount) {
    if (sendIndex >= txCount) return;

    const gasLimit = parseInt(process.env.GAS_LIMIT);
    const randomAmount = getRandomAmount();
    const amountToDeposit = web3.utils.toWei(randomAmount, 'ether');
    const valueToDeposit = parseFloat(amountToDeposit);
    const depETH = wethContract.methods.deposit().encodeABI();

    const transactionObject = {
        from: account.address,
        to: wethCA,
        value: valueToDeposit,
        maxPriorityFeePerGas: web3.utils.toHex(web3.utils.toWei(process.env.MAX_PRIORITY_FEE_PER_GAS, "gwei")),
        maxFeePerGas: web3.utils.toHex(web3.utils.toWei(process.env.MAX_FEE_PER_GAS, "gwei")),
        type: 2,
        chainId: 167000,
        data: depETH,
        gasLimit: web3.utils.toHex(gasLimit)
    };

    const amountSent = web3.utils.fromWei(amountToDeposit, 'ether');
    totalAmountDeposited += parseFloat(amountSent);

    try {
        console.log(chalk.hex('#90ee90')(`\n🔄 Melakukan Swap ${amountSent} ETH ke WETH...`));
        const transactionReceipt = await web3.eth.sendTransaction(transactionObject);
        
        console.log(chalk.hex('#90ee90')(`✅ Transaksi berhasil!`));
        const transactionLink = `https://taikoscan.io/tx/${transactionReceipt.transactionHash}`;
        console.log(chalk.hex('#add8e6')(`🔗 Rincian transaksi: ${transactionLink}`));

        const points = await getLatestData(account.address);
        const formatPoints = points.join(', '); 
        const walletLink = `https://taikoscan.io/address/${account.address}`;

        const message = `[Address](${walletLink})\n✅ *Swap ${amountSent} ETH ke WETH berhasil!*\n🔗 [Transaksi hash](${transactionLink})\n📊 *Points Tx sebelumnya: ${formatPoints} *`;
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

        totalGasSpent += parseFloat(web3.utils.fromWei((transactionReceipt.gasUsed * transactionReceipt.effectiveGasPrice).toString(), 'ether'));

        const wethBalance = await wethContract.methods.balanceOf(account.address).call();
        totalWETHBalance = parseFloat(web3.utils.fromWei(wethBalance.toString(), 'ether'));

    } catch (depositError) {
        console.error(chalk.hex('#8B0000')(`❌ Error depositing ETH: ${depositError}`));
    }
}

async function withdraw(sendIndex, txCount) {
    if (sendIndex >= txCount) return;

    const wethBalance = await wethContract.methods.balanceOf(account.address).call();
    const initialWETHBalance = parseInt(wethBalance);
    const gasLimit = parseInt(process.env.GAS_LIMIT);
    const randomAmount = getRandomAmount();
    const amountToWithdraw = web3.utils.toWei(randomAmount, 'ether');
    let valueToWithdraw = parseInt(amountToWithdraw);

    if (initialWETHBalance <= valueToWithdraw) {
        valueToWithdraw = initialWETHBalance;
    }

    if (initialWETHBalance === 0) {
        await akhirnya();
        return;
    }

    const withETH = wethContract.methods.withdraw(valueToWithdraw).encodeABI();

    const transactionObject = {
        from: account.address,
        to: wethCA,
        value: 0,
        maxPriorityFeePerGas: web3.utils.toHex(web3.utils.toWei(process.env.MAX_PRIORITY_FEE_PER_GAS, "gwei")),
        maxFeePerGas: web3.utils.toHex(web3.utils.toWei(process.env.MAX_FEE_PER_GAS, "gwei")),
        type: 2,
        chainId: 167000,
        data: withETH,
        gasLimit: web3.utils.toHex(gasLimit)
    };

    const amountSent = web3.utils.fromWei(valueToWithdraw.toString(), 'ether');
    totalAmountWithdrew += parseFloat(amountSent);

    try {
        console.log(chalk.hex('#90ee90')(`\n🔄 Melakukan Swap ${amountSent} WETH ke ETH...`));
        const transactionReceipt = await web3.eth.sendTransaction(transactionObject);

        console.log(chalk.hex('#90ee90')(`✅ Transaksi berhasil!`));
        const transactionLink = `https://taikoscan.io/tx/${transactionReceipt.transactionHash}`;
        console.log(chalk.hex('#add8e6')(`🔗 Rincian transaksi: ${transactionLink}`));

        const points = await getLatestData(account.address);
        const formatPoints = points.join(', ');
        const walletLink = `https://taikoscan.io/address/${account.address}`;

        const message = `[Address](${walletLink})\n✅ *Swap ${amountSent} WETH ke ETH berhasil!*\n🔗 [Transaksi hash](${transactionLink})\n📊 *Points Tx sebelumnya: ${formatPoints} *`;
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (withdrawError) {
        console.error(chalk.hex('#8B0000')(`❌ Error withdraw ETH: ${withdrawError}`));
    }
}

async function akhirnya() {
    console.log(chalk.hex('#dda0dd')('✅ Proses selesai.'));
    
    const totalTransactionsCount = (totalWithdrawCount) + (totalDepositCount);

    console.log(chalk.hex('#90ee90')('💰 Total ETH deposit: ' + totalAmountDeposited.toFixed(8) + ' ETH'));
    console.log(chalk.hex('#90ee90')('💰 Total ETH withdrawal: ' + totalAmountWithdrew.toFixed(8) + ' ETH'));
    console.log(chalk.hex('#90ee90')('⚖️ Total transaksi (jumlah): ' + totalTransactionsCount + ' transaksi'));
    console.log(chalk.hex('#90ee90')('🧯 Total biaya gas: ' + totalGasSpent.toFixed(8) + ' ETH'));

    const wethBalance = await wethContract.methods.balanceOf(account.address).call();
    totalWETHBalance = parseFloat(web3.utils.fromWei(wethBalance.toString(), 'ether'));
    console.log(chalk.hex('#90ee90')(`📈 Saldo WETH: ${totalWETHBalance.toFixed(8)} WETH`));

    const queryRemainingBalance = await web3.eth.getBalance(account.address);
    const remainingBalance = parseFloat(web3.utils.fromWei(queryRemainingBalance, 'ether')).toFixed(8);
    console.log(chalk.hex('#90ee90')('📈 Saldo ETH: ' + remainingBalance + ' ETH'));

    const response = await axios.get(`https://trailblazer.mainnet.taiko.xyz/s2/user/rank?address=${account.address}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
        },
    });

    const rank = response.data.rank;
    console.log(chalk.hex('#90ee90')(`🏆 Rank: ${rank}`));

    const score = response.data.totalScore;
    console.log(chalk.hex('#90ee90')(`📊 Total Point: ${parseFloat(score).toFixed(0)}`));

    const walletLink = `https://taikoscan.io/address/${account.address}`;
    const message = `*Proses Selesai! Untuk Address*\n*${account.address}*\n💰 *- Total depo: ${totalAmountDeposited.toFixed(5)} ETH*\n💰 *- Total wd: ${totalAmountWithdrew.toFixed(5)} ETH*\n⚖️ *- Total depo + wd: ${totalTransactionsCount}x*\n⚖️ *- Total biaya gas: ${totalGasSpent.toFixed(5)} ETH*\n📈 *- Saldo WETH: ${totalWETHBalance.toFixed(6)} WETH*\n📈 *- Saldo ETH: ${remainingBalance} ETH*\n🏆 *- Rank: ${rank}*\n📊 *- Total Point: ${parseFloat(score).toFixed(0)}*\n`;

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

async function startBot() {
    console.clear();
    displayskw();
    console.log();
    await delay(3000);

    try {
        const address = account.address;
        let shouldContinue = true;

        console.log();
        await deposit(1);
        totalDepositCount++;
        console.log(chalk.hex('#ffb347')(`⏳ Delay 5 Detik`));
        await startCountdown(4);
        console.log();

        await withdraw(1);
        totalWithdrawCount++;
        console.log(chalk.hex('#90ee90')('✅ 2x Swap untuk mendapatkan point baru Selesai!'));
        console.log(chalk.hex('#ffffe0')('⏳ Delay 1 jam agar point diweb sudah dipastikan update!'));
        await startCountdown(3600);
        console.log();
        console.log();

        while (shouldContinue) {
            const depositCount = 1;
            const withdrawCount = 1;

            await deposit(0, depositCount);
            totalDepositCount++;

            const pointsAfterDeposit = await getLatestData(address);
            const formatPointsdepo = pointsAfterDeposit.join(', ');
            console.log(chalk.hex('#dda0dd')('📊 Poin tx Terakhir:', formatPointsdepo));

            console.log(chalk.hex('#ffb347')('⏳ Delay 2 Menit Sebelum Melakukan Swap Lagi.....'));
            await startCountdown(120);
            console.log();

            if (pointsAfterDeposit.some(point => point === 0)) {
                console.log(chalk.hex('#ff6666')('🚫 Daily Max Reached\n'));
                shouldContinue = false;
                break;
            }

            await withdraw(0, withdrawCount);
            totalWithdrawCount++;

            const pointsAfterWithdraw = await getLatestData(address);
            const formatPointswd = pointsAfterWithdraw.join(', ');
            console.log(chalk.hex('#dda0dd')('📊 Poin Terakhir:', formatPointswd));

            console.log(chalk.hex('#ffb347')('⏳ Delay 2 Menit Sebelum Melakukan Swap Lagi.....'));
            await startCountdown(120);
            console.log();

            if (pointsAfterWithdraw.some(point => point === 0)) {
                console.log(chalk.hex('#ff6666')('🚫 Daily Max Reached\n'));
                shouldContinue = false;
                break;
            }
        }

        await akhirnya();
    } catch (error) {
        console.error('Error dalam startBot:', error);
    }
}

async function startBotSKW() {
    console.clear();
    displayskw();
    console.log();
    await delay(3000);

    try {
        const address = account.address;
        let shouldContinue = true;

        while (shouldContinue) {
            const depositCount = 1;
            const withdrawCount = 1;

            await deposit(0, depositCount);
            totalDepositCount++;

            const pointsAfterDeposit = await getLatestData(address);
            const formatPointsdepo = pointsAfterDeposit.join(', ');
            console.log(chalk.hex('#dda0dd')('📊 Poin tx Terakhir:', formatPointsdepo));

            console.log(chalk.hex('#ffb347')('⏳ Delay 2 Menit Sebelum Melakukan Swap Lagi.....'));
            await startCountdown(120);
            console.log();

            if (pointsAfterDeposit.some(point => point === 0)) {
                console.log(chalk.hex('#ff6666')('🚫 Daily Max Reached\n'));
                shouldContinue = false;
                break;
            }

            await withdraw(0, withdrawCount);
            totalWithdrawCount++;

            const pointsAfterWithdraw = await getLatestData(address);
            const formatPointswd = pointsAfterWithdraw.join(', ');
            console.log(chalk.hex('#dda0dd')('📊 Poin Terakhir:', formatPointswd));

            console.log(chalk.hex('#ffb347')('⏳ Delay 2 Menit Sebelum Melakukan Swap Lagi.....'));
            await startCountdown(120);
            console.log();

            if (pointsAfterWithdraw.some(point => point === 0)) {
                console.log(chalk.hex('#ff6666')('🚫 Daily Max Reached\n'));
                shouldContinue = false;
                break;
            }
        }

        await akhirnya();
        process.exit()
    } catch (error) {
        console.error('Error dalam startBot:', error);
    }
}

async function startautobot() {
    await startBot();
    process.exit();
}


async function startCountdown(seconds) {
    return new Promise((resolve) => {
        let countdown = seconds;

        const countdownInterval = setInterval(() => {
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                resolve();
            } else {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(chalk.hex('#ffb347')(`⏱️ Waktu Yg Tersisa: ${countdown} detik`));
                countdown--;
            }
        }, 1000);
    });
}

async function main() {
    cron.schedule('1 0 * * *', async () => { 
        await startBot();
        console.log();
        console.log(chalk.magenta.bold(`Cron AKTIF`));
        console.log(chalk.magenta('Jam 07:01 WIB Autobot Akan Run Ulang...'));
    });

    await startBot();
    console.log();
    console.log(chalk.magenta.bold(`Cron AKTIF`));
    console.log(chalk.magenta('Jam 07:01 WIB Autobot Akan Run Ulang...'));
}

autobot();
