/* eslint-disable linebreak-style */
// Import the required npm packages

const express = require('express');
const morgan = require('morgan');
const createError = require('http-errors');
const bodyParser = require('body-parser');
const cors = require('cors');
const useragent = require('express-useragent');
const path = require('path');
const { MORGAN_CONFIG } = require('./helpers/resource/constants');
const { logger } = require('./helpers/service/loggerService');
// Redis connect
// require('./helpers/db/init_redis');
const { mongoConnect } = require('./helpers/db/mongoService');
const { addRoutes } = require('./routes/api');
// Import the required packages
const config = require('./helpers/environment/config');
const http = require("http")
const https = require("https");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { setupSocket } = require("./helpers/service/socketService");

// Socket config
let { PORT, PROTOCOL } = process.env;
if (!PORT) {
  createError(
    "app:user:app.js",
    "FATAL ERROR : Port is not defind! Please check .env setting"
  );
  process.exit(1);
}
if (!PROTOCOL) {
  createError(
    "app:user:app.js",
    "FATAL ERROR : PROTOCOL is not defind! Please check .env setting"
  );
  process.exit(1);
}

const startServer = () => {
  // mongo connection
  mongoConnect();
  // create an express app
  const app = express();
  app.use(cors());
  app.use(useragent.express());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.set('trust proxy', true);
  const options = {
    inflate: true,
    limit: '100kb',
    type: 'text/xml',
  };
  app.use(bodyParser.raw(options));
  // middleware to add basic logging
  app.use(morgan(MORGAN_CONFIG, { stream: logger.stream }));
  // middleware to parse request
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/', express.static(path.join(__dirname, 'public', 'frontend')));
  // add all routes
  addRoutes(app);
  // error handling
  // errorHandlerMiddleware();
  app.use(async (req, res, next) => {
    next(createError.NotFound());
  });
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV === 'development' ? err : {};
    // render the error page
    // res.status(err.status || 500);
    return res.status(err.status || 500).json({
      success: false,
      status: err.status || 500,
      message: err.message,
    });
  });


  /* -----------Start Websocket------------*/
  const httpServer = http.createServer(app);
  // Initialize HTTP or HTTPS server based on protocol
  if (PROTOCOL === "http") {
    const httpServer = createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: "*", // Adjust this to your requirements
        methods: ["GET", "POST"],
      },
    });

    setupSocket(io); // Set up WebSocket events

    // httpServer.listen(PORT, () => {
    //   console.log(`Server started on HTTP at port ${PORT}`);
    // });
    httpServer.listen(config.port, () => {
      console.log(config.startedMessage);
    });
  } else if (PROTOCOL === "https") {
    const privateKey = fs.readFileSync(
      path.resolve(__dirname, "sslcert/user_service.key"),
      "utf8"
    );
    const certificate = fs.readFileSync(
      path.resolve(__dirname, "sslcert/user_service.crt"),
      "utf8"
    );

    const httpsServer = require("https").createServer(
      { key: privateKey, cert: certificate },
      app
    );

    const io = new Server(httpsServer, {
      cors: {
        origin: "*", // Adjust this to your requirements
        methods: ["GET", "POST"],
      },
    });

    setupSocket(io); // Set up WebSocket events

    // httpsServer.listen(PORT, () => {
    //   console.log(`Server started on HTTPS at port ${PORT}`);
    // });
    httpServer.listen(config.port, () => {
      console.log(config.startedMessage);
    });
  } else {
    console.error(
      "FATAL ERROR: Invalid PROTOCOL value. Use either 'http' or 'https'."
    );
    process.exit(1);
  }


  // // const httpServer = require("http").createServer(app);
  // const io = require("socket.io")(httpServer, {
  //   cors: {
  //     origin: ["http://localhost:3000",],
  //   },
  // });


  // io.use(authSocket);
  // // io.on("connection", (socket) => socketServer(socket));
  // io.on("connection", (socket) => {
  //   socketServer(io, socket); // Pass io and socket to the socketServer
  // });
  // socketService.listenConnection();
  // const io = require("socket.io")(httpServer, {
  //   cors: {
  //     origin: ["http://localhost:3000",],
  //   },
  // });
  // Define WebSocket events
  // io.on("connection", (socket) => {
  //   console.log("A user connected");

  //   // Example event handling
  //   socket.on("message", (data) => {
  //     console.log("Message received:", data);
  //     io.emit("message", data); // Broadcast message to all connected clients
  //   });

  //   socket.on("disconnect", () => {
  //     console.log("User disconnected");
  //   });
  // });

};
module.exports = {
  startServer,
};
