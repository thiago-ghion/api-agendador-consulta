const grupoApi = 'estatistica';
const db = require('.././models/index.js');
const Util = require('../util/Util');
const _ = require('underscore');

function registrarMetodos(app, incluirNivelAccesso) {
  const listarHorariosMaisUtilizadosURL = `/v1/${grupoApi}/listarHorariosMaisUtilizados`;
  incluirNivelAccesso(listarHorariosMaisUtilizadosURL, 3);
  app.get(listarHorariosMaisUtilizadosURL, (req, res) => {
    listarHorariosMaisUtilizados(req, res);
  });

  const listarConsultasDiasSemanaURL = `/v1/${grupoApi}/listarConsultasDiasSemana`;
  incluirNivelAccesso(listarConsultasDiasSemanaURL, 3);
  app.get(listarConsultasDiasSemanaURL, (req, res) => {
    listarConsultasDiasSemana(req, res);
  });

  const listarProfissionaisMaisConsultasURL = `/v1/${grupoApi}/listarProfissionaisMaisConsultas`;
  incluirNivelAccesso(listarProfissionaisMaisConsultasURL, 3);
  app.get(listarProfissionaisMaisConsultasURL, (req, res) => {
    listarProfissionaisMaisConsultas(req, res);
  });

  const listarConsultasAtivasVersusCanceladasURL = `/v1/${grupoApi}/listarConsultasAtivasVersusCanceladas`;
  incluirNivelAccesso(listarConsultasAtivasVersusCanceladasURL, 3);
  app.get(listarConsultasAtivasVersusCanceladasURL, (req, res) => {
    listarConsultasAtivasVersusCanceladas(req, res);
  });

  const listarLoginProprioVersusOauthURL = `/v1/${grupoApi}/listarLoginProprioVersusOauth`;
  incluirNivelAccesso(listarLoginProprioVersusOauthURL, 3);
  app.get(listarLoginProprioVersusOauthURL, (req, res) => {
    listarLoginProprioVersusOauth(req, res);
  });
}

const validarPeriodo = (req, res) => {
  if (req.query.dataInicio === undefined) {
    res
      .status(400)
      .send({ mensagem: 'Data início da pesquisa não foi informada' });
    return;
  }

  if (!Util.isDataValida(req.query.dataInicio)) {
    res.status(400).send({
      mensagem: 'Data início da pesquisa está com formato incorreto',
    });
    return;
  }

  if (req.query.dataFim === undefined) {
    res
      .status(400)
      .send({ mensagem: 'Data fim da pesquisa não foi informada' });
    return;
  }

  if (!Util.isDataValida(req.query.dataFim)) {
    res.status(400).send({
      mensagem: 'Data fim da pesquisa está com formato incorreto',
    });
    return;
  }

  try {
    if (Util.quantidadeDias(req.query.dataInicio, req.query.dataFim) > 60) {
      res.status(400).send({
        mensagem: 'Intervalo superior a 60 dias corridos',
      });
      return;
    }
  } catch (erro) {
    res.status(400).send({
      mensagem: erro.message,
    });
    return;
  }

  return {
    dataInicio: Util.converterEmDataIso(req.query.dataInicio),
    dataFim: Util.converterEmDataIso(req.query.dataFim),
  };
};

const listarHorariosMaisUtilizados = async (req, res) => {
  try {
    const datas = validarPeriodo(req, res);
    if (datas === undefined) {
      return;
    }
    const lista = await db.sequelize.query(
      `
      SELECT C."idHorario", H."textoHorario", COUNT(1) as quantidade  
      FROM "Consulta" C, "Horario" H 
      WHERE C."indicadorConsultaCancelada" = 'N'
      AND   C."idHorario"                  = H."idHorario" 
      AND   C."dataVinculo" BETWEEN '${datas.dataInicio}' AND '${datas.dataFim}' 
      GROUP BY C."idHorario", H."textoHorario"
      ORDER BY 3 DESC
      FETCH FIRST 5 ROWS ONLY
  `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    res.send(lista);
  } catch (err) {
    res.status(400).send({
      mensagem: 'Falha na recuperação da lista de horários mais utilizados',
    });
  }
};

const listarConsultasDiasSemana = async (req, res) => {
  try {
    const datas = validarPeriodo(req, res);
    if (datas === undefined) {
      return;
    }

    const lista = await db.sequelize.query(
      `
      SELECT EXTRACT(DOW FROM C."dataVinculo") as dia, COUNT(1) as quantidade  
      FROM   "Consulta" C 
      WHERE  C."indicadorConsultaCancelada" = 'N'
      AND    C."dataVinculo" BETWEEN '${datas.dataInicio}' AND '${datas.dataFim}' 
      GROUP BY 1
      ORDER BY 1
      `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const listaDias = [0, 0, 0, 0, 0, 0, 0];

    _(lista).each((item) => {
      listaDias[item.dia] += item.quantidade;
    });

    _(listaDias).each((item, index) => {
      if (item === 0) {
        lista.push({ dia: index, quantidade: 0 });
      }
    });

    res.send(_(lista).sortBy((item) => item.dia));
  } catch (err) {
    res.status(400).send({
      mensagem: 'Falha na recuperação da lista de horários mais utilizados',
    });
  }
};

const listarProfissionaisMaisConsultas = async (req, res) => {
  try {
    const datas = validarPeriodo(req, res);
    if (datas === undefined) {
      return;
    }

    const lista = await db.sequelize.query(
      `
      SELECT C."idProfissional", P."nomeProfissional", COUNT(1) as quantidade  
      FROM  "Consulta" C, 
            "Profissional" P 
      WHERE  C."indicadorConsultaCancelada" = 'N'
      AND    P."idProfissional"             = C."idProfissional"
      AND    C."dataVinculo" BETWEEN '${datas.dataInicio}' AND '${datas.dataFim}' 
      GROUP BY 1, 2
      ORDER BY 3 DESC
      FETCH FIRST 5 ROWS ONLY 
  `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    res.send(lista);
  } catch (err) {
    res.status(400).send({
      mensagem:
        'Falha na recuperação da lista de profissionais com mais consultas',
    });
  }
};

const listarConsultasAtivasVersusCanceladas = async (req, res) => {
  try {
    const datas = validarPeriodo(req, res);
    if (datas === undefined) {
      return;
    }

    const ativas = await db.sequelize.query(
      `
      SELECT COUNT(1) as quantidade
      FROM  "Consulta" C
      WHERE "indicadorConsultaCancelada" = 'N'
      AND    C."dataVinculo" BETWEEN '${datas.dataInicio}' AND '${datas.dataFim}' 
    `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const canceladas = await db.sequelize.query(
      `
      SELECT COUNT(1) as quantidade
      FROM  "Consulta" C
      WHERE "indicadorConsultaCancelada" = 'S'
      AND    C."dataVinculo" BETWEEN '${datas.dataInicio}' AND '${datas.dataFim}' 
    `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    res.send([
      { rotulo: 'Ativas', quantidade: +ativas[0].quantidade },
      { rotulo: 'Canceladas', quantidade: +canceladas[0].quantidade },
    ]);
  } catch (err) {
    res.status(400).send({
      mensagem:
        'Falha na recuperação de quantidade de consultas ativas versus canceladas',
    });
  }
};

const listarLoginProprioVersusOauth = async (req, res) => {
  try {
    const datas = validarPeriodo(req, res);
    if (datas === undefined) {
      return;
    }

    const proprio = await db.sequelize.query(
      `
      SELECT COUNT(1) as quantidade
      FROM   "RegistroAcesso" R 
      WHERE  R."tipoAcesso" = 1
      AND    R."timestampAcesso" BETWEEN '${datas.dataInicio}' AND '${datas.dataFim}' 
    `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const oauth = await db.sequelize.query(
      `
      SELECT COUNT(1) as quantidade
      FROM   "RegistroAcesso" R 
      WHERE  R."tipoAcesso" = 2
      AND    R."timestampAcesso" BETWEEN 
             '${Util.converterEmDataInvertida(
               req.query.dataInicio
             )}T00:00:00.000-03:00'
      AND    '${Util.converterEmDataInvertida(
        req.query.dataFim
      )}T23:59:59.999-03:00' 
    `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    res.send([
      { rotulo: 'Próprio', quantidade: +proprio[0].quantidade },
      { rotulo: 'OAuth', quantidade: +oauth[0].quantidade },
    ]);
  } catch (err) {
    res.status(400).send({
      mensagem: 'Falha na recuperação da lista de login próprio versus oauth',
    });
  }
};

module.exports = {
  registrarMetodos,
  validarPeriodo,
  listarHorariosMaisUtilizados,
  listarConsultasDiasSemana,
  listarProfissionaisMaisConsultas,
  listarConsultasAtivasVersusCanceladas,
  listarLoginProprioVersusOauth,
};
