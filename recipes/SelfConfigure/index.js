const express = require('expressif');
const wifi = require('Wifi');

const HomePage = () => {
  const scriptTag = (function() {
    let scan = document.getElementById("scan");
    let ssidElem = document.getElementById("ssid");
    let form = document.getElementById("form");
    let submit = document.getElementById("submit");
    let points = document.querySelector("table tbody");
    let container = document.getElementById("access-points");
    let clearTable = () => {
      container.style.display = "grid";
      for (let index = points.children.length; index > 0; index--) {
        points.removeChild(points.children[index - 1]);
      }
    };
    points.addEventListener("click", e => {
      if (e.target.className === "ssid") {
        ssidElem.value = e.target.innerText;
        ssidElem.dispatchEvent(new Event("change"));
      }
    });
    ssidElem.addEventListener("change", e => {
      submit.className = e.target.value === "" ? "disabled" : "";
    });
    submit.addEventListener("click", () => {
      submit.className = "disabled";
      let body = {};
      for (let index = 0; index < form.elements.length; index++) {
        let element = form.elements[index];
        body[element.name] = element.value;
      }
      fetch("/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(res => {
        submit.className = "";
      });
    }, true);
    scan.addEventListener("click", () => {
      button.className = "disabled";
      clearTable();
      fetch("/scan", { method: "GET" })
        .then(res => res.json())
        .then(json => {
          submit.className = "";
          json.forEach(point => {
            let row = document.createElement("tr");
            let ssid = document.createElement("td");
            ssid.className = "ssid";
            row.append(ssid);
            let auth = document.createElement("td");
            row.append(auth);
            ssid.innerHTML = point.ssid;
            auth.innerHTML = point.authMode;
            points.append(row);
          });
        })
        .catch(console.error);
    }, true);
  });

  return (
`<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=0">
    <title>Configure WI-FI</title>
    <style>
      body {
        background: black;
        font-family: sans-serif;
        color: #fff;
      }
      h3 {
        color: #eee;
      }
      #submit {
        border: solid 2px #31de57;
        background-color: #29a945;
      }
      #submit:hover {
        background-color: #31de57;
      }
      a {
        border: solid 2px #ffc800;
        background-color: orange;
        padding: 5px 60px;
        border-radius: 5px;
        font-weight: bold;
        width: 90%;
      }
      .disabled {
        border: solid 2px #ddd !important;
        pointer-events: none;
        background-color: #ccc !important;
      }
      a.disabled:hover {
        cursor: not-allowed;
      }
      a:hover {
        cursor: pointer;
        background-color: #f8d111;
      }
      table {
        background: #eee;
        margin: 10px;
        color: #000;
      }
      tbody td {
        border: solid 1px #ccc;
        padding: 5px;
      }
      tbody .ssid:hover {
        border: solid 1px #ffc800;
        color: #fff;
        background-color: orange;
        cursor: pointer;
      }
      #access-points {
        display: grid;
      }
      .buttons {
        margin-top: 30px;
      }
      #form {
        display: inline-grid;
      }
      label {
        text-align: left;
      }
    </style>
  </head>
  <body>
    <div style="text-align:center; margin-top:20px; margin-bottom:20px">
      <h3>Configure WiFi</h3>
      <div class="form">
        <form id="form">
          <label for="ssid">SSID</label>
          <input id="ssid" name="ssid"/>
          <br/>
          <label for="password">Password</label>
          <input id="password" name="password" type="password"/>
        </form>
      </div>
      <div class="buttons">
        <a id="submit" class="disabled">Update</a>
        <a id="scan">Scan</a>
      </div>
    </div>
    <div id="access-points" style="display: none;">
      <table>
        <thead>
          <tr>
            <th>SSID</th>
            <th>Auth</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
    <script>(${scriptTag})();</script>
  </body>
</html>`);
};

function configureApp(app) {
  app.get("/", (req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(new HomePage());
  });

  app.get("/scan", (req, res) => {
    wifi.scan(details => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(details));
    });
  });

  app.post("/configure", (req, res) => {
    let body = "";
    req.on("data", content => {
      body += content;
    });
    req.on("end", () => {
      let json = JSON.parse(body);
      wifi.connect(json.ssid, { password: json.password }, err => {
        if (!err) {
          wifi.save();
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(wifi.getIP()));
      });
    });
  });
}

E.on('init', () => {
  const server = express.createServer(configureApp);
  wifi.startAP("ESP_HOTSPOT", { authmode: 'none' }, () => {
    server.listen(80);
  });
});
