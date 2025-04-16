const WebSocket = require('ws');
const { ethers } = require('ethers');
const { signMessage } = require('@metamask/eth-sig-util'); // Or use ethers Wallet
const { keccak256, toUtf8Bytes } = require('ethers/lib/utils');

const uri = "wss://api.hyperliquid-testnet.xyz/ws";
const tokenFilters = ["SOL", "BTC"];
const minSize = 0.1;
const cooldown = 60 * 1000;
let lastAlert = {};

const fillMatchesCriteria = (fill) => {
  const { coin, sz, dir } = fill;
  const size = parseFloat(sz);
  const now = Date.now();

  return (
    tokenFilters.includes(coin) &&
    size >= minSize &&
    ["Open Long", "Close Long", "Reduce Position"].includes(dir) &&
    (!lastAlert[coin] || now - lastAlert[coin] > cooldown)
  );
};

function parseFill(fill) {
  return `${fill.dir} ${fill.coin} | Size: ${fill.sz} | Price: ${fill.px} | PnL: ${fill.closedPnl ?? 'N/A'}`;
}

const startMonitoring = (io) => {
  let ws;

  const connect = () => {
    ws = new WebSocket(uri);

    ws.on('open', () => {
      console.log('WebSocket connected');
      authenticate(ws);
      subscribe(ws);
    });

    ws.on('message', (data) => {
      try {
        const json = JSON.parse(data);
        if (json.channel === 'user' && json.data?.fills?.length) {
          const fill = json.data.fills[0];
          if (fillMatchesCriteria(fill)) {
            lastAlert[fill.coin] = Date.now();
            const msg = parseFill(fill);
            console.log("ALERT:", msg);
            io.emit('fill_alert', msg);
          }
        }
      } catch (err) {
        console.error("Parsing error:", err);
      }
    });

    ws.on('close', () => {
      console.log('Disconnected. Reconnecting...');
      setTimeout(connect, 5000);
    });

    ws.on('error', (err) => {
      console.error("WebSocket error:", err);
    });
  };

  connect();
};

const authenticate = (ws) => {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const timestamp = Date.now();
  const msg = `hyperliquid_${timestamp}`;
  const sig = wallet.signMessage(msg);

  sig.then((signature) => {
    const authPayload = {
      method: "subscribe",
      subscription: {
        type: "user",
        user: process.env.WALLET_ADDRESS
      },
      signature,
      timestamp
    };
    ws.send(JSON.stringify(authPayload));
  });
};

const subscribe = (ws) => {
  const msg = {
    method: "subscribe",
    subscription: {
      type: "userFills",
      user: process.env.WALLET_ADDRESS
    }
  };
  ws.send(JSON.stringify(msg));
};

module.exports = { startMonitoring };
