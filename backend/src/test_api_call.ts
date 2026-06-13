import http from "http";

const payload = JSON.stringify({
  grid: [
    ["#", "#", "S", "#", "#"],
    ["B", "I", "T", "E", "S"],
    ["#", "#", "#", "#", "#"], // blocked at row 2 col 2
    ["C", "A", "C", "H", "E"],
    ["#", "#", "K", "#", "#"]
  ],
  words: ["STACK", "BITES", "CACHE", "ALERT", "BLOCK", "CODES", "DOMAIN", "EDGES"],
  algorithm: "forward-checking"
});

const req = http.request(
  {
    hostname: "localhost",
    port: 5000,
    path: "/api/solve",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    }
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("Status Code:", res.statusCode);
      console.log("Response Body:", data);
    });
  }
);

req.on("error", (e) => {
  console.error("Problem with request:", e.message);
});

req.write(payload);
req.end();
