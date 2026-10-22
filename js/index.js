
const URL =
      "wss://data.tradingview.com/socket.io/websocket";

    const SYMBOLS = [
      "FX:EURUSD",
      "FX:GBPUSD",
      "OANDA:XAUUSD"
    ];

    const FIELDS = [
      "lp",
      "bid",
      "ask",
      "ch",
      "chp"
    ];

    const latest = {};

    let ws = null;
    let quoteSession = null;


    // =========================================
    // 2. SESSION GENERATOR
    // =========================================

    function randomSession(prefix) {
      const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

      let result = prefix;

      for (let i = 0; i < 12; i++) {
        result += chars[
          Math.floor(Math.random() * chars.length)
        ];
      }

      return result;
    }


    // =========================================
    // 3. MESSAGE FRAMING
    // =========================================

    function frame(payload) {
      return `~m~${payload.length}~m~${payload}`;
    }


    function makeMessage(method, params) {
      const payload = JSON.stringify({
        m: method,
        p: params
      });

      return frame(payload);
    }


    function send(method, params) {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        log("Cannot send: WebSocket is not open.");
        return;
      }

      ws.send(makeMessage(method, params));
    }


    // =========================================
    // 4. DECODE INCOMING FRAMES
    // =========================================

    function splitFrames(raw) {
      const payloads = [];
      let pos = 0;

      while (pos < raw.length) {
        const prefix = raw.slice(pos).match(/^~m~(\d+)~m~/);

        if (!prefix) {
          break;
        }

        const length = Number(prefix[1]);
        const start = pos + prefix[0].length;
        const end = start + length;

        // Wait for a complete frame if necessary.
        if (end > raw.length) {
          break;
        }

        payloads.push(raw.slice(start, end));

        pos = end;
      }

      return payloads;
    }


    // =========================================
    // 5. CONNECT TO TRADINGVIEW
    // =========================================

    function connect() {
      if (
        ws &&
        (
          ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING
        )
      ) {
        log("Already connected or connecting.");
        return;
      }

      quoteSession = randomSession("qs_");

      log("Connecting to TradingView...");

      setStatus("Connecting");

      try {
        ws = new WebSocket(URL);

        ws.addEventListener("open", () => {
          log("WebSocket connection opened.");

          setStatus("Connected");

          // Anonymous authentication attempt.
          send(
            "set_auth_token",
            ["unauthorized_user_token"]
          );

          // Create quote session.
          send(
            "quote_create_session",
            [quoteSession]
          );

          // Select fields before adding symbols.
          send(
            "quote_set_fields",
            [quoteSession, ...FIELDS]
          );

          // Subscribe to symbols.
          send(
            "quote_add_symbols",
            [quoteSession, ...SYMBOLS]
          );

          log("Subscription messages sent.");
        });


        ws.addEventListener("message", (event) => {
          handleMessage(String(event.data));
        });


        ws.addEventListener("error", () => {
          log("WebSocket error. Check browser console.");
        });


        ws.addEventListener("close", (event) => {
          setStatus("Disconnected");

          log(
            `Connection closed. Code: ${event.code}`
          );
        });

      } catch (error) {
        setStatus("Error");
        log("Connection error: " + error.message);
      }
    }


    // =========================================
    // 6. PROCESS MESSAGES
    // =========================================

    function handleMessage(raw) {
      const payloads = splitFrames(raw);

      for (const payload of payloads) {

        // Heartbeat: echo the heartbeat payload.
        if (payload.startsWith("~h~")) {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(frame(payload));
          }

          continue;
        }

        let data;

        try {
          data = JSON.parse(payload);
        } catch {
          continue;
        }

        if (!data || !data.m) {
          continue;
        }

        if (data.m === "qsd") {
          handleQuote(data.p);
        }
      }
    }


    // =========================================
    // 7. PROCESS PRICE UPDATES
    // =========================================

    function handleQuote(params) {
      if (!Array.isArray(params) || !params[1]) {
        return;
      }

      const quote = params[1];

      if (quote.s !== "ok") {
        log(
          "Quote status: " +
          (quote.s || "unknown") +
          " for " +
          (quote.n || "unknown symbol")
        );

        return;
      }

      const symbol = quote.n;
      const values = quote.v || {};

      if (!symbol) {
        return;
      }

      // Merge partial updates with previously received values.
      latest[symbol] = {
        ...(latest[symbol] || {}),
        ...values
      };

      renderPrices();

      console.log(symbol, latest[symbol]);
    }


    // =========================================
    // 8. DISPLAY PRICES
    // =========================================

    function renderPrices() {
      const container = document.getElementById("prices");

      container.innerHTML = SYMBOLS.map((symbol) => {
        const p = latest[symbol] || {};

        return `
          <div class="price-card">
            <div class="symbol">${symbol}</div>

            <div class="price">
              ${displayValue(p.lp)}
            </div>

            <div class="details">
              Bid: ${displayValue(p.bid)}<br>
              Ask: ${displayValue(p.ask)}<br>
              Change: ${displayValue(p.ch)}<br>
              Change %: ${displayValue(p.chp)}
            </div>
          </div>
        `;
      }).join("");
    }


    function displayValue(value) {
      return value === undefined || value === null
        ? "--"
        : String(value);
    }


    // =========================================
    // 9. STATUS AND LOGGING
    // =========================================

    function setStatus(value) {
      document.getElementById("status").textContent = value;
    }


    function log(message) {
      const logs = document.getElementById("logs");

      logs.textContent +=
        "\n" + new Date().toLocaleTimeString() + " " + message;

      logs.scrollTop = logs.scrollHeight;
    }


    // =========================================
    // 10. DISCONNECT
    // =========================================

    function disconnect() {
      if (ws) {
        ws.close();
        ws = null;
      }

      setStatus("Disconnected");

      log("Disconnected by user.");
    }


    // =========================================
    // 11. BUTTONS
    // =========================================

    document
      .getElementById("connectBtn")
      .addEventListener("click", connect);

    document
      .getElementById("disconnectBtn")
      .addEventListener("click", disconnect);

    renderPrices();

  