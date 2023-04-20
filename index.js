import cluster from 'cluster';
import compression from 'compression';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import koa from 'koa';
import { koaBody } from 'koa-body';
import bodyParser from 'koa-bodyparser';
import session from 'koa-session';
import serve from 'koa-static';
import os from 'os';
import passport from 'passport';

import { logInfo, logWarning } from './src/loggers/index.js';

import config from './src/config/config.js';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Server as HttpServer } from 'http';
import { Server as Socket } from 'socket.io';

import productosApiRouter from './src/routers/api/productos.js';
import randomsApiRouter from './src/routers/api/randoms.js';
import authWebRouter from './src/routers/web/auth.js';
import homeWebRouter from './src/routers/web/home.js';
import infoWebRouter from './src/routers/web/info.js';

import addMensajesHandlers from './src/routers/ws/mensajes.js';
import addProductosHandlers from './src/routers/ws/productos.js';

import objectUtils from './src/utils/objectUtils.js';

//--------------------------------------------
// instancio servidor, socket , api y passport

const app = new koa();
const httpServer = new HttpServer(app);
const io = new Socket(httpServer);

//--------------------------------------------
// configuro el socket

io.on('connection', async (socket) => {
  // console.log('Nuevo cliente conectado!');
  addProductosHandlers(socket, io.sockets);
  addMensajesHandlers(socket, io.sockets);
});

//--------------------------------------------
// configuro el servidor

// MIDDLEWARE SERVE
app.use(serve(path.join(process.cwd(), '/public')));

// MIDDLEWARE KOA BODY
app.use(koaBody({ multipart: true }));

// MIDDLEWARE PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// MIDDLEWARE BODY PARSER
app.use(bodyParser());

// MIDDLEWARE COMPRESS
app.use(compression());

// MIDDLEWARE COOKIE PARSER
app.use(cookieParser());

// MIDDLEWARE SESSION
app.keys = [config.session.secret];
const sessionConfig = {
  key: 'koa:sess',
  maxAge: config.session.maxAge,
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: true,
  rolling: false,
  renew: false,
  secure: false,
  sameSite: null,
  store: MongoStore.create({
    mongoUrl: config.mongoRemote.cnxStr,
    mongoOptions: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  }),
};
app.use(session(sessionConfig, app));
//--------------------------------------------

import auth from './src/routers/web/auth.js';
const sessions = auth;
// app.use('/api/sessions', sessions);
//req.session.passport.user

//--------------------------------------------
// rutas del servidor API REST

app.use(productosApiRouter.routes);
app.use(randomsApiRouter.routes);

//--------------------------------------------
// rutas del servidor web

app.use(authWebRouter.routes);
app.use(homeWebRouter.routes);
app.use(infoWebRouter.routes);

//--------------------------------------------
// logging casos no manejados

// app.use('*', (ctx, next) => {
//   logWarning(`${ctx.method} ${ctx.originalUrl} - ruta inexistente!`);
//   next();
// });

// // logging general

app.use((ctx, next) => {
  logInfo(`${ctx.method} ${ctx.originalUrl}`);
  next();
});

// Test DTO
// import ProductosController from './src/controller/Productos.controller.js';
// app.use('/test', (ctx, next) => {
//   ProductosController.listarAllCotizaciones().then((docs) => {
//     ctx.body = docs;
//   });
// });

// app.get('/test', async (req, res) => {
//   const docs = await ProductosController.listarAllCotizaciones();
//   res.json(docs);
// });

// Test MOCHA API
// import { api } from './src/api/productos.js';
// app.use('/apiProductos', api);

//--------------------------------------------
// inicio el servidor

// CLUSTER
export const CPU_CORES = os.cpus().length;
if (config.mode == 'CLUSTER' && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Número de procesadores: ${numCPUs}`);
  console.log(`PID MASTER ${process.pid}`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(
      `Worker finalizó proceso ${process.pid} ${worker.id} ${
        worker.pid
      } finalizó el ${new Date().toLocaleString}`
    );
    cluster.fork();
  });
} else {
  process.on('exit', (code) => {
    console.log('Salida con código de error: ' + code);
  });

  httpServer.listen(config.PORT, (err) => {
    if (!err)
      console.log(
        `Servidor http escuchando en el puerto ${config.PORT} - PID: ${process.pid}`
      );
  });
}
