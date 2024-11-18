require('colors');
const inquirer = require('inquirer');
const Bot = require('./src/Bot');
const Config = require('./src/Config');
const {
  fetchProxies,
  readLines,
  selectProxySource,
} = require('./src/ProxyManager');
const { delay, displayHeader } = require('./src/utils');

async function main() {
  displayHeader();
  console.log(`Please wait...\n`.yellow);

  await delay(1000);

  const config = new Config();
  const bot = new Bot(config);

  // const proxySource = await selectProxySource(inquirer);
const proxySource = {
  type: 'file',
  source: 'proxy.txt'
}
  let proxies = [];
  if (proxySource.type === 'file') {
    proxies = await readLines(proxySource.source);
  } else if (proxySource.type === 'url') {
    proxies = await fetchProxies(proxySource.source);
  } else if (proxySource.type === 'none') {
    console.log('No proxy selected. Connecting directly.'.cyan);
  }

  if (proxySource.type !== 'none' && proxies.length === 0) {
    console.error('No proxies found. Exiting...'.red);
    return;
  }

  console.log(
    proxySource.type !== 'none'
      ? `Loaded ${proxies.length} proxies`.green
      : 'Direct connection mode enabled.'.green
  );

  const userIDs = await readLines('uid.txt');
  if (userIDs.length === 0) {
    console.error('No user IDs found in uid.txt. Exiting...'.red);
    return;
  }

  console.log(`Loaded ${userIDs.length} user IDs\n`.green);

  const methods = ["desktop", "lite", "node"];

  const connectionPromises = userIDs.flatMap((userID) =>
    proxySource.type !== 'none'
      ? proxies.flatMap((proxy) =>
          methods.map((method) => {
            if (method === "desktop") {
              return bot.connectToProxy(proxy, userID);
            } else if (method === "lite") {
              return bot.connectToProxyLite(proxy, userID);
            } else if (method === "node") {
              return bot.connectToProxyNode(proxy, userID);
            }
          })
        )
      : [bot.connectDirectly(userID)]
  );
  
  await Promise.all(connectionPromises);
  
}

main().catch(console.error);
