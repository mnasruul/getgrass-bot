require('colors');
const WebSocket = require('ws');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fakeUa = require('fake-useragent');
const logger = require('pino')()
class Bot {
  constructor(config) {
    this.config = config;
  }

  async getProxyIP(proxy) {
    // const agent = proxy.startsWith('http')
    //   ? new HttpsProxyAgent(proxy)
    //   : new SocksProxyAgent(proxy);
    // try {
    //   const response = await axios.get(this.config.ipCheckURL, {
    //     httpsAgent: agent,
    //   });
    //   logger.info(`Connected through proxy ${proxy}`.green);
    //   return response.data;
    // } catch (error) {
    //   logger.error(
    //     `Skipping proxy ${proxy} due to connection error: ${error.message}`
    //       .yellow
    //   );
    //   return null;
    // }
    return { ip: proxy };
  }

  async connectToProxy(proxy, userID) {
    let formattedProxy;

    if (
      /socks5:\/\/.*:.*:.*:.*$/.test(proxy) ||
      /http:\/\/.*:.*:.*:.*$/.test(proxy)
    ) {
      formattedProxy = proxy;
    } else if (
      proxy.startsWith('socks5://') ||
      proxy.startsWith('http://') ||
      proxy.startsWith('https://')
    ) {
      formattedProxy = proxy;
    } else {
      formattedProxy = `socks5://${proxy}`;
    }

    try {
      const proxyInfo = await this.getProxyIP(formattedProxy);

      if (!proxyInfo) {
        logger.error(`Proxy ${formattedProxy} is not reachable.`.red);
        return;
      }

      logger.info(`Formatted Proxy: ${formattedProxy}`.cyan);

      const agent = formattedProxy.startsWith('http')
        ? new HttpsProxyAgent(formattedProxy)
        : new SocksProxyAgent(formattedProxy);

      const wsURL = `wss://${this.config.wssHost}`;
      const userAgent = fakeUa();
      logger.info(`User-Agent: ${userAgent}`.cyan);
      const ws = new WebSocket(wsURL, {
        agent,
        headers: {
          'User-Agent':
          userAgent,
          Pragma: 'no-cache',
          'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          OS: 'Windows',
          Platform: 'Desktop',
          Browser: 'Mozilla',
        },
      });

      ws.on('open', () => {
        logger.info(`Connected to ${formattedProxy} via Desktop`.cyan);
        logger.info(`Proxy IP Info: ${JSON.stringify(proxyInfo)}`.magenta);
        this.sendPing(ws, proxyInfo.ip);
      });

      ws.on('message', (message) => {
        const msg = JSON.parse(message);
        logger.info(`Received message: ${JSON.stringify(msg)}`.blue);

        if (msg.action === 'AUTH') {
          const authResponse = {
            id: msg.id,
            origin_action: 'AUTH',
            result: {
              browser_id: uuidv4(),
              user_id: userID,
              user_agent: userAgent,
              timestamp: Math.floor(Date.now() / 1000),
              device_type: 'desktop',
              version: '4.28.2',
            },
          };
          ws.send(JSON.stringify(authResponse));
          logger.info(
            `Sent auth response: ${JSON.stringify(authResponse)}`.green
          );
        } else if (msg.action === 'PONG') {
          logger.info(`Received PONG: ${JSON.stringify(msg)}`.blue);
          const pong_response = {"id": msg["id"], "origin_action": "PONG"}
          logger.info(`Sending PONG: ${JSON.stringify(pong_response)}`.green);
          ws.send(JSON.stringify(pong_response))
        }
      });

      ws.on('close', (code, reason) => {
        logger.info(
          `WebSocket closed with code: ${code}, reason: ${reason}`.yellow
        );
        setTimeout(
          () => this.connectToProxy(proxy, userID),
          this.config.retryInterval
        );
      });

      ws.on('error', (error) => {
        logger.error(
          `WebSocket error on proxy ${formattedProxy}: ${error.message}`.red
        );
        ws.terminate();
      });
    } catch (error) {
      logger.error(
        `Failed to connect with proxy ${proxy}: ${error.message}`.red
      );
    }
  }
  async connectToProxyLite(proxy, userID) {
    let formattedProxy;

    if (
      /socks5:\/\/.*:.*:.*:.*$/.test(proxy) ||
      /http:\/\/.*:.*:.*:.*$/.test(proxy)
    ) {
      formattedProxy = proxy;
    } else if (
      proxy.startsWith('socks5://') ||
      proxy.startsWith('http://') ||
      proxy.startsWith('https://')
    ) {
      formattedProxy = proxy;
    } else {
      formattedProxy = `socks5://${proxy}`;
    }

    try {
      const proxyInfo = await this.getProxyIP(formattedProxy);

      if (!proxyInfo) {
        logger.error(`Proxy ${formattedProxy} is not reachable.`.red);
        return;
      }

      logger.info(`Formatted Proxy: ${formattedProxy}`.cyan);

      const agent = formattedProxy.startsWith('http')
        ? new HttpsProxyAgent(formattedProxy)
        : new SocksProxyAgent(formattedProxy);

      const wsURL = `wss://${this.config.wssHost}`;
      const userAgent = fakeUa();
      const ws = new WebSocket(wsURL, {
        agent,
        headers: {
          'User-Agent':
          userAgent,
          // Pragma: 'no-cache',
          // 'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
          // 'Cache-Control': 'no-cache',
          // OS: 'Windows',
          // Platform: 'Desktop',
          // Browser: 'Mozilla',
        "Origin": "chrome-extension://ilehaonighjijnmpnagapkhpcdbhclfg"
        },
      });

      ws.on('open', () => {
        logger.info(`Connected to ${formattedProxy} via Lite`.cyan);
        logger.info(`Proxy IP Info: ${JSON.stringify(proxyInfo)}`.magenta);
        this.sendPing(ws, proxyInfo.ip);
      });

      ws.on('message', (message) => {
        const msg = JSON.parse(message);
        logger.info(`Received message: ${JSON.stringify(msg)}`.blue);

        if (msg.action === 'AUTH') {
          const authResponse = {
            id: msg.id,
            origin_action: 'AUTH',
            result: {
              browser_id: uuidv4(),
              user_id: userID,
              user_agent: userAgent,
              timestamp: Math.floor(Date.now() / 1000),
              "device_type": "extension",
              "version": "4.26.2",
              "extension_id": "ilehaonighjijnmpnagapkhpcdbhclfg"
            },
          };
          ws.send(JSON.stringify(authResponse));
          logger.info(
            `Sent auth response: ${JSON.stringify(authResponse)}`.green
          );
        } else if (msg.action === 'PONG') {
          logger.info(`Received PONG: ${JSON.stringify(msg)}`.blue);
          const pong_response = {"id": msg["id"], "origin_action": "PONG"}
          logger.info(`Sending PONG: ${JSON.stringify(pong_response)}`.green);
          ws.send(JSON.stringify(pong_response))
        }
      });

      ws.on('close', (code, reason) => {
        logger.info(
          `WebSocket closed with code: ${code}, reason: ${reason}`.yellow
        );
        setTimeout(
          () => this.connectToProxyLite(proxy, userID),
          this.config.retryInterval
        );
      });

      ws.on('error', (error) => {
        logger.error(
          `WebSocket error on proxy ${formattedProxy}: ${error.message}`.red
        );
        ws.terminate();
      });
    } catch (error) {
      logger.error(
        `Failed to connect with proxy ${proxy}: ${error.message}`.red
      );
    }
  }
  async connectToProxyNode(proxy, userID) {
    let formattedProxy;

    if (
      /socks5:\/\/.*:.*:.*:.*$/.test(proxy) ||
      /http:\/\/.*:.*:.*:.*$/.test(proxy)
    ) {
      formattedProxy = proxy;
    } else if (
      proxy.startsWith('socks5://') ||
      proxy.startsWith('http://') ||
      proxy.startsWith('https://')
    ) {
      formattedProxy = proxy;
    } else {
      formattedProxy = `socks5://${proxy}`;
    }

    try {
      const proxyInfo = await this.getProxyIP(formattedProxy);

      if (!proxyInfo) {
        logger.error(`Proxy ${formattedProxy} is not reachable.`.red);
        return;
      }

      logger.info(`Formatted Proxy: ${formattedProxy}`.cyan);

      const agent = formattedProxy.startsWith('http')
        ? new HttpsProxyAgent(formattedProxy)
        : new SocksProxyAgent(formattedProxy);

      const wsURL = `wss://${this.config.wssHost}`;
      const userAgent = fakeUa();
      const ws = new WebSocket(wsURL, {
        agent,
        headers: {
          'User-Agent':
          userAgent,
          // Pragma: 'no-cache',
          // 'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
          // 'Cache-Control': 'no-cache',
          // OS: 'Windows',
          // Platform: 'Desktop',
          // Browser: 'Mozilla',
           "Origin": "chrome-extension://lkbnfiajjmbhnfledhphioinpickokdi"
        },
      });

      ws.on('open', () => {
        logger.info(`Connected to ${formattedProxy} via Node`.cyan);
        logger.info(`Proxy IP Info: ${JSON.stringify(proxyInfo)}`.magenta);
        this.sendPing(ws, proxyInfo.ip);
      });

      ws.on('message', (message) => {
        const msg = JSON.parse(message);
        logger.info(`Received message: ${JSON.stringify(msg)}`.blue);

        if (msg.action === 'AUTH') {
          const authResponse = {
            id: msg.id,
            origin_action: 'AUTH',
            result: {
              browser_id: uuidv4(),
              user_id: userID,
              user_agent: userAgent,
              timestamp: Math.floor(Date.now() / 1000),
              "device_type": "extension",
              "version": "4.26.2",
              "extension_id": "lkbnfiajjmbhnfledhphioinpickokdi"
            },
          };
          ws.send(JSON.stringify(authResponse));
          logger.info(
            `Sent auth response: ${JSON.stringify(authResponse)}`.green
          );
        } else if (msg.action === 'PONG') {
          logger.info(`Received PONG: ${JSON.stringify(msg)}`.blue);
          const  pong_response = {"id": msg["id"], "origin_action": "PONG"}
          logger.info(`Sending PONG: ${JSON.stringify(pong_response)}`.green);
          ws.send(JSON.stringify(pong_response))
        }
      });

      ws.on('close', (code, reason) => {
        logger.info(
          `WebSocket closed with code: ${code}, reason: ${reason}`.yellow
        );
        setTimeout(
          () => this.connectToProxyNode(proxy, userID),
          this.config.retryInterval
        );
      });

      ws.on('error', (error) => {
        logger.error(
          `WebSocket error on proxy ${formattedProxy}: ${error.message}`.red
        );
        ws.terminate();
      });
    } catch (error) {
      logger.error(
        `Failed to connect with proxy ${proxy}: ${error.message}`.red
      );
    }
  }

  async connectDirectly(userID) {
    try {
      const wsURL = `wss://${this.config.wssHost}`;
      const ws = new WebSocket(wsURL, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0',
          Pragma: 'no-cache',
          'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          OS: 'Windows',
          Platform: 'Desktop',
          Browser: 'Mozilla',
        },
      });

      ws.on('open', () => {
        logger.info(`Connected directly without proxy`.cyan);
        this.sendPing(ws, 'Direct IP');
      });

      ws.on('message', (message) => {
        const msg = JSON.parse(message);
        logger.info(`Received message: ${JSON.stringify(msg)}`.blue);

        if (msg.action === 'AUTH') {
          const authResponse = {
            id: msg.id,
            origin_action: 'AUTH',
            result: {
              browser_id: uuidv4(),
              user_id: userID,
              user_agent: 'Mozilla/5.0',
              timestamp: Math.floor(Date.now() / 1000),
              device_type: 'desktop',
              version: '4.28.2',
            },
          };
          ws.send(JSON.stringify(authResponse));
          logger.info(
            `Sent auth response: ${JSON.stringify(authResponse)}`.green
          );
        } else if (msg.action === 'PONG') {
          logger.info(`Received PONG: ${JSON.stringify(msg)}`.blue);
        }
      });

      ws.on('close', (code, reason) => {
        logger.info(
          `WebSocket closed with code: ${code}, reason: ${reason}`.yellow
        );
        setTimeout(
          () => this.connectDirectly(userID),
          this.config.retryInterval
        );
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error: ${error.message}`.red);
        ws.terminate();
      });
    } catch (error) {
      logger.error(`Failed to connect directly: ${error.message}`.red);
    }
  }

  sendPing(ws, proxyIP) {
    setInterval(() => {
      const pingMessage = {
        id: uuidv4(),
        version: '1.0.0',
        action: 'PING',
        data: {},
      };
      ws.send(JSON.stringify(pingMessage));
      logger.info(
        `Sent ping - IP: ${proxyIP}, Message: ${JSON.stringify(pingMessage)}`
          .cyan
      );
    }, 26000);
  }
}

module.exports = Bot;
