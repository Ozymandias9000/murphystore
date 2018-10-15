const cookieParser = require("cookie-parser");
require("dotenv").config({ path: "variables.env" });
const createServer = require("./createServer");
const db = require("./db");

const server = createServer();

server.express.use(cookieParser());

// decode JWT so we can get user id
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  console.log(token);
  next();
});

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL
    }
  },
  deets => console.log(`Running on port ${deets.port}!`)
);
