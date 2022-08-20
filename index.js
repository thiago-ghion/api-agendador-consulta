const logger = require('./util/logger');
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

logger.info(`Utilizando a porta ${port}`);

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

var passport = require('passport');

const seguranca = require('./api/seguranca');
const profissional = require('./api/profissional');
const consulta = require('./api/consulta');
const paciente = require('./api/paciente');
const horario = require('./api/horario');
const usuario = require('./api/usuario');
const estatistica = require('./api/estatistica');

app.use(express.json());
app.use(cors());

const serverEstatico = (req, res) => {
  res.sendFile('index.html', { root: __dirname + '/' });
};

app.get('/', function (req, res) {
  serverEstatico(req, res);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const filtroSegurancao = (req, res, next) => {
  if (
    req.url.match('seguranca') ||
    req.url.match('api-docs') ||
    req.url.match('introspect') ||
    req.method === 'OPTIONS'
  ) {
    next();
  } else {
    req.nivelUsuarioEndpoint = 99;
    listaAcesso.forEach((item) => {
      if (req.url.match(item.rota)) {
        req.nivelUsuarioEndpoint = item.nivel;
      }
    });
    logger.info(`Requisição ${req.url} - Nível: ${req.nivelUsuarioEndpoint}`);

    passport.authenticate('jwt', { session: false }, (err, token) => {
      logger.info(`Autenticando o token local`, token);
      if (err || !token) {
        if (err !== null && err.message !== null) {
          return res.status(401).send({
            mensagem: err.message,
          });
        }
        logger.error(`Token local inválido`, err);

        return res.status(401).send({
          mensagem: 'Efetue o login novamente, a sessão expirou',
        });
      } else {
        req.token = token;
        next();
      }
    })(req, res);
  }
};

app.use(filtroSegurancao);

const listaAcesso = [];

const incluirNivelAcesso = (_rota, nivel) => {
  const posicao = _rota.indexOf(':');
  let rota = _rota;
  if (posicao != -1) {
    rota = _rota.substring(0, posicao - 1);
  }

  listaAcesso.push({ rota, nivel });
};

logger.info('Inicializando os services');
seguranca.registrarMetodos(app, incluirNivelAcesso, passport);
logger.info('Segurança - OK');
profissional.registrarMetodos(app, incluirNivelAcesso);
logger.info('Profissional - OK');
consulta.registrarMetodos(app, incluirNivelAcesso);
logger.info('Consulta - OK');
paciente.registrarMetodos(app, incluirNivelAcesso);
logger.info('Paciente - OK');
horario.registrarMetodos(app, incluirNivelAcesso);
logger.info('Horario - OK');
usuario.registrarMetodos(app, incluirNivelAcesso);
logger.info('Usuario - OK');
estatistica.registrarMetodos(app, incluirNivelAcesso);
logger.info('Estatistica - OK');

app.listen(port, () => {});

exports.incluirNivelAcesso = incluirNivelAcesso;
exports.listaAcesso = listaAcesso;
exports.filtroSegurancao = filtroSegurancao;
