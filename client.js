require("dotenv").config();
const crypto = require('crypto');
const axios = require("axios");

const payload = { "highScore": 1024 };
const key = process.env.WRONG_SECRET ?? process.env.SECRET;
const dataToHash = {
  ...payload,
  timestamp: Number(process.env.TIMESTAMP ?? new Date()),
  uuid: crypto.randomBytes(16).toString("hex")
}

const hash = crypto.createHmac('sha1', key)
  .update(JSON.stringify(dataToHash))
  .digest('hex');

(async () => {
  let result;
  try {
    result = await axios.post("http://localhost:4567/score", {
      ...dataToHash,
      hash
    });
  } catch (e) {
    console.error(e.toString());
    if (e.response) {
      console.error(e.response.data);
    }
    return;
  }
  console.log(result.data);
})();
