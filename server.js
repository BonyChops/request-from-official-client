require("dotenv").config();
const fs = require("fs");
const crypto = require('crypto');
const fastify = require('fastify')({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  }
});
const dbName = "timestampDB.txt";
const key = process.env.WRONG_SECRET ?? process.env.SECRET;

fastify.post('/score', async (request, reply) => {
  const { body } = request;

  //Check param
  if (!["timestamp", "uuid", "hash"].every(key => body[key])) {
    throw new Error("Not enough param");
  }

  // Clientを検証
  // 1. タイムスタンプをチェック
  if (Math.abs(body.timestamp - Number(new Date())) > 1000) {
    throw new Error("Too far timestamp from now.");
  }
  // 2. 過去に受け取ったか？(UUIDは面倒くさいので考慮しない)
  if (
    fs.existsSync(dbName) &&
    Number(fs.readFileSync(dbName).toString().trim()) >= body.timestamp
  ) {
    throw new Error("This request is already recieved.");
  }
  // 3. HMAC作成&検証
  const dataToHash = Object.fromEntries(
    Object.entries(body)
      .filter(v => v[0] !== "hash")
  );
  const hash = crypto.createHmac('sha1', key)
    .update(JSON.stringify(dataToHash))
    .digest('hex');

  if(hash !== body.hash){
    throw new Error("Invalid request");
  }
  console.log("Recieved valid request!:");
  console.log(body);

  //受け取ったタイムスタンプを記録しておく
  fs.writeFileSync(dbName, String(body.timestamp));

  return { status: 'success' }
})

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT ?? 4567 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()