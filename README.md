# TAIKO AUTO SWAP
## Fitur
- Melakukan 2x SWAP untuk mendapatkan point baru
- Melakukan SWAP hingga Daily Max Reached
- Otomatis mengulang Autobot dijam 7 Pagi
- Pantau Status melalui Telegram
- Dapatkan rincian (gas yang dipakai, berapa x swap, Point di web, dll

### Step

1. Clone repo dan masuk ke folder
```
git clone https://github.com/yogik23/skw-taiko.git && cd skw-taiko
```
2. Install Module `abaikan jika ada eror npm audit-fixx atau npm audit-fix-eror`
```
npm install
```
3. Buat file `.env` copy file `.env.contoh` submit privatekey, API bot, UserID telegram
```
nano .env
```
4. Jalankan Bot
```
node main.js
```
\
Taiko Tracker buat cek point kalian
[Taiko-bot](https://t.me/taikoxnxxbot)
