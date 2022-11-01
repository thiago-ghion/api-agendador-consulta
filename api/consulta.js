const grupoApi = 'consulta';
const db = require('.././models/index.js');
const Util = require('.././util/Util.js');
const _ = require('underscore');
const logger = require('../util/logger');
const moment = require('moment');

const PROPRIO_PACIENTE = 1;
const COLABORADOR = 2;

const registrarMetodos = (app, incluirNivelAccesso) => {
  const agendarURL = `/v1/${grupoApi}/agendar`;
  incluirNivelAccesso(agendarURL, 1);
  app.post(agendarURL, (req, res) => {
    agendar(req, res);
  });

  const cancelarURL = `/v1/${grupoApi}/cancelar`;
  incluirNivelAccesso(cancelarURL, 1);
  app.post(cancelarURL, (req, res) => {
    cancelar(req, res);
  });

  const listarConsultaURL = `/v1/${grupoApi}/listarConsulta`;
  incluirNivelAccesso(listarConsultaURL, 1);
  app.get(listarConsultaURL, (req, res) => {
    listarConsulta(req, res);
  });

  const listarConsultaTodasPacienteURL = `/v1/${grupoApi}/listarConsultaTodasPaciente`;
  incluirNivelAccesso(listarConsultaTodasPacienteURL, 1);
  app.get(listarConsultaTodasPacienteURL, (req, res) => {
    listarConsultaTodasPaciente(req, res);
  });

  const listarConsultaTodasProfissionalURL = `/v1/${grupoApi}/listarConsultaTodasProfissional`;
  incluirNivelAccesso(listarConsultaTodasProfissionalURL, 1);
  app.get(listarConsultaTodasProfissionalURL, (req, res) => {
    listarConsultaTodasProfissional(req, res);
  });
};

const validacaoPayloadConsulta = async (req, res) => {
  if (req.body.idPaciente === undefined) {
    res.status(400).send({ mensagem: 'Número do paciente não informado' });
    return false;
  }

  if (req.token.nivelUsuario === 1 && req.body.idPaciente !== req.token.id) {
    res
      .status(400)
      .send({ mensagem: 'Não é permitido utilizar este paciente' });
    return false;
  }

  const paciente = await db.Paciente.findOne({
    where: { idPaciente: req.body.idPaciente },
  });

  if (paciente === null) {
    res.status(400).send({ mensagem: 'Paciente não encontrado' });
    return false;
  }

  if (req.body.idProfissional === undefined) {
    res.status(400).send({ mensagem: 'Número do profissional não encontrado' });
    return false;
  }

  const profissional = await db.Profissional.findOne({
    where: { idProfissional: req.body.idProfissional },
  });

  if (profissional === null) {
    res.status(400).send({ mensagem: 'Profissional não encontrado' });
    return false;
  }

  if (req.body.dataConsulta === undefined) {
    res.status(400).send({ mensagem: 'Data da consulta não informada' });
    return false;
  }

  if (!Util.isDataValida(req.body.dataConsulta)) {
    res.status(400).send({ mensagem: 'Data da consulta inválida' });
    return false;
  }

  if (req.body.idHorario === undefined) {
    res.status(400).send({ mensagem: 'Horário não informado' });
    return false;
  }

  const horario = await db.Horario.findOne({
    where: { idHorario: req.body.idHorario },
  });

  if (horario === null) {
    res.status(400).send({ mensagem: 'Horário não encontrado' });
    return false;
  }

  return true;
};

const agendar = async (req, res) => {
  try {
    const isValido = await validacaoPayloadConsulta(req, res);

    if (!isValido) {
      return;
    }

    const vinculo = await db.VinculoProfissionalHorario.findOne({
      where: {
        idProfissional: req.body.idProfissional,
        idHorario: req.body.idHorario,
        dataVinculo: Util.converterEmDataIso(req.body.dataConsulta),
        indicadorAtivo: 'S',
      },
    });

    if (vinculo === null) {
      res
        .status(400)
        .send({ mensagem: 'Data/Horário não encontrado para o profissional' });
      return;
    }

    const consulta = await db.Consulta.findOne({
      where: {
        idProfissional: req.body.idProfissional,
        idHorario: req.body.idHorario,
        dataVinculo: Util.converterEmDataIso(req.body.dataConsulta),
        indicadorConsultaCancelada: 'N',
      },
    });

    if (consulta !== null) {
      res.status(400).send({
        mensagem: 'Data/Horário não está disponível para agendamento',
      });
      return;
    }

    const consultaPaciente = await db.Consulta.findOne({
      where: {
        idProfissional: req.body.idProfissional,
        idHorario: req.body.idHorario,
        dataVinculo: Util.converterEmDataIso(req.body.dataConsulta),
      },
    });

    let colaborador = null;
    let tipoOrigemConsulta = PROPRIO_PACIENTE;
    if (req.token.nivelUsuario === 2 || req.token.nivelUsuario === 3) {
      colaborador = req.token.id;
      tipoOrigemConsulta = COLABORADOR;
    }

    logger.info(
      `Colaborador: ${colaborador} Origem Consulta: ${tipoOrigemConsulta}`
    );

    await db.sequelize.transaction(async (t) => {
      let acaoAgendamento;
      
      if (consultaPaciente === null) {
        acaoAgendamento = 'I';
        await db.Consulta.create(
          {
            idProfissional: req.body.idProfissional,
            idHorario: req.body.idHorario,
            dataVinculo: Util.converterEmDataIso(req.body.dataConsulta),
            idPaciente: req.body.idPaciente,
            indicadorConsultaCancelada: 'N',
            tipoOrigemConsulta: tipoOrigemConsulta,
            idColaborador: colaborador,
          },
          { transaction: t }
        );
      } else {
        acaoAgendamento = 'A';
        await db.sequelize.query(
          `
          UPDATE "Consulta"
          SET
                 "indicadorConsultaCancelada" = 'N'
          ,      "idColaborador"              = ${colaborador}
          ,      "tipoOrigemConsulta"         = ${tipoOrigemConsulta}
          ,      "idPaciente"                 = ${req.body.idPaciente}
          WHERE  "idProfissional"             = ${req.body.idProfissional}
          AND    "idHorario"                  = ${req.body.idHorario}
          AND    "dataVinculo"                = '${Util.converterEmDataIso(
            req.body.dataConsulta
          )}'
          `,
          { type: db.sequelize.QueryTypes.UPDATE, transaction: t }
        );
      }

      await db.HistoricoConsulta.create(
        {
          timestampHistorico: db.sequelize.literal('CURRENT_TIMESTAMP'),
          textoTipoAcao: acaoAgendamento,
          idProfissional: req.body.idProfissional,
          idHorario: req.body.idHorario,
          dataVinculo: Util.converterEmDataIso(req.body.dataConsulta),
          idPaciente: req.body.idPaciente,
          indicadorConsultaCancelada: 'N',
          tipoOrigemConsulta: tipoOrigemConsulta,
          idColaborador: colaborador,
        },
        { transaction: t }
      );

      const resposta = {
        idPaciente: req.body.idPaciente,
        idProfissional: req.body.idProfissional,
        dataConsulta: req.body.dataConsulta,
        idHorario: req.body.idHorario,
      };

      res.status(201).send(resposta);
    });
  } catch (error) {
    logger.error('Falha no agendamento da consulta', error);
    res.status(400).send({ mensagem: 'Falha no agendamento da consulta' });
  }
};

const cancelar = async (req, res) => {
  try {
    const isValido = await validacaoPayloadConsulta(req, res);

    if (!isValido) {
      return;
    }

    const consulta = await db.Consulta.findOne({
      where: {
        idProfissional: req.body.idProfissional,
        idHorario: req.body.idHorario,
        dataVinculo: Util.converterEmDataIso(req.body.dataConsulta),
        idPaciente: req.body.idPaciente,
      },
    });

    if (consulta === null) {
      logger.error('Consulta não foi encontrada');
      res.status(400).send({ mensagem: 'Consulta não foi encontrada' });
      return;
    }

    if (consulta.indicadorConsultaCancelada !== 'N') {
      logger.error('Consulta não está ativa', req.body);
      res.status(400).send({ mensagem: 'Consulta não pode ser cancelada' });
      return;
    }

    const horario = await db.Horario.findOne({
      where: { idHorario: req.body.idHorario },
    });

    const isDataAnterior = Util.isDataAnterior(
      `${consulta.dataVinculo} ${horario.textoHorario}`,
      Util.getDataHoraAtual()
    );

    if (!isDataAnterior) {
      logger.error(
        'Data/Horário da consulta não permitem o cancelamento',
        req.body
      );
      res.status(400).send({
        mensagem: 'Data/Horário da consulta não permitem o cancelamento',
      });
      return;
    }

    let colaborador = null;
    if (req.token.nivelUsuario === 2 || req.token.nivelUsuario === 3) {
      colaborador = req.token.id;
    }

    logger.info(`Colaborador: ${colaborador}`);

    await db.sequelize.transaction(async (t) => {
      await consulta.update(
        {
          indicadorConsultaCancelada: 'S',
        },
        { transaction: t }
      );

      await db.HistoricoConsulta.create(
        {
          timestampHistorico: db.sequelize.literal('CURRENT_TIMESTAMP'),
          textoTipoAcao: 'A',
          idProfissional: req.body.idProfissional,
          idHorario: req.body.idHorario,
          dataVinculo: Util.converterEmDataIso(req.body.dataConsulta),
          idPaciente: req.body.idPaciente,
          indicadorConsultaCancelada: consulta.indicadorConsultaCancelada,
          tipoOrigemConsulta: consulta.tipoOrigemConsulta,
          idColaborador: colaborador,
        },
        { transaction: t }
      );

      const resposta = {
        idPaciente: req.body.idPaciente,
        idProfissional: req.body.idProfissional,
        dataConsulta: req.body.dataConsulta,
        idHorario: req.body.idHorario,
      };
      res.send(resposta);
    });
  } catch (erro) {
    logger.error('Falha no cancelamento da consulta', erro);
    res.status(400).send({ mensagem: 'Falha no cancelamento da consulta' });
  }
};

const podeCancelarConsulta = (
  dataConsulta,
  horario,
  indicadorConsultaCancelada
) => {
  return moment(`${dataConsulta} ${horario}`, 'DD.MM.YYYY HH:mm').isSameOrAfter(
    moment()
  ) && indicadorConsultaCancelada === 'N'
    ? 'S'
    : 'N';
};

const listarConsulta = async (req, res) => {
  try {
    if (req.query.idPaciente === undefined) {
      res
        .status(400)
        .send({ mensagem: 'Número do paciente não foi informado' });
      return;
    }

    if (req.query.idProfissional === undefined) {
      res
        .status(400)
        .send({ mensagem: 'Número do profissional não foi informado' });
      return;
    }

    if (req.query.dataInicio === undefined) {
      res
        .status(400)
        .send({ mensagem: 'Data início da pesquisa não foi informada' });
      return;
    }

    if (!Util.isDataValida(req.query.dataInicio)) {
      res.status(400).send({ mensagem: 'Data início da pesquisa inválida' });
      return;
    }

    if (req.query.dataFim === undefined) {
      res
        .status(400)
        .send({ mensagem: 'Data fim da pesquisa não foi informada' });
      return;
    }

    if (!Util.isDataValida(req.query.dataFim)) {
      res.status(400).send({ mensagem: 'Data fim da pesquisa inválida' });
      return;
    }

    const intervaloTempo = Util.quantidadeDias(
      req.query.dataInicio,
      req.query.dataFim
    );

    if (intervaloTempo > 60) {
      res
        .status(400)
        .send({ mensagem: 'Intervalo de pesquisa superior a 60 dias' });
      return;
    }

    const lista = await db.sequelize.query(
      `
      SELECT  C."idProfissional" ,
              P."nomeProfissional" ,
              C."dataVinculo" ,
              C."idHorario" , 
              H."textoHorario" , 
              C."indicadorConsultaCancelada"
      FROM   "Consulta" C , 
             "Profissional" P , 
             "Horario" H
      WHERE  C."idProfissional" = P."idProfissional" 
      AND    H."idHorario" = C."idHorario"
      AND    C."idProfissional" = ${req.query.idProfissional}
      AND    C."idPaciente" = ${req.query.idPaciente}
      AND    C."dataVinculo" BETWEEN '${Util.converterEmDataIso(
        req.query.dataInicio
      )}' 
      AND  '${Util.converterEmDataIso(req.query.dataFim)}' 
      `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const resposta = _(lista).map((item) => ({
      idProfissional: item.idProfissional,
      nomeProfissional: item.nomeProfissional,
      dataConsulta: Util.formatarData(item.dataVinculo),
      idHorario: item.idHorario,
      horario: item.textoHorario,
      indicadorPermissaoCancelar: item.indicadorConsultaCancelada,
    }));

    res.send(resposta);
  } catch (erro) {
    logger.error('Falha na listagem das consultas do profissional', erro);
    res
      .status(400)
      .send({ mensagem: 'Falha na listagem das consultas do profissional' });
  }
};

const listarConsultaTodasPaciente = async (req, res) => {
  try {
    if (req.query.idPaciente === undefined) {
      res
        .status(400)
        .send({ mensagem: 'Número do paciente não foi informado' });
      return;
    }

    if (req.query.dataInicio === undefined) {
      res
        .status(400)
        .send({ mensagem: 'Data início da pesquisa não foi informada' });
      return;
    }

    if (!Util.isDataValida(req.query.dataInicio)) {
      res.status(400).send({ mensagem: 'Data início da pesquisa inválida' });
      return;
    }

    if (req.query.dataFim === undefined) {
      res
        .status(400)
        .send({ mensagem: 'Data fim da pesquisa não foi informada' });
      return;
    }

    if (!Util.isDataValida(req.query.dataFim)) {
      res.status(400).send({ mensagem: 'Data fim da pesquisa inválida' });
      return;
    }

    const intervaloTempo = Util.quantidadeDias(
      req.query.dataInicio,
      req.query.dataFim
    );

    if (intervaloTempo > 60) {
      res
        .status(400)
        .send({ mensagem: 'Intervalo de pesquisa superior a 60 dias' });
      return;
    }

    const lista = await db.sequelize.query(
      `
      SELECT C."idProfissional" ,
             P."nomeProfissional" ,
             C."dataVinculo" ,
             C."idHorario" , 
             H."textoHorario" , 
             C."indicadorConsultaCancelada" 
      FROM  "Consulta" C , 
            "Profissional" P , 
            "Horario" H 
      WHERE  C."idProfissional" = P."idProfissional" 
      AND    H."idHorario" = C."idHorario"
      AND    C."idPaciente" = '${req.query.idPaciente}' 
      AND    C."dataVinculo" BETWEEN '${Util.converterEmDataIso(
        req.query.dataInicio
      )}' 
      AND  '${Util.converterEmDataIso(req.query.dataFim)}' 
      AND   C."indicadorConsultaCancelada" = 'N' 
      `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const resposta = _(lista).map((item) => ({
      idProfissional: item.idProfissional,
      nomeProfissional: item.nomeProfissional,
      dataConsulta: Util.formatarData(item.dataVinculo),
      idHorario: item.idHorario,
      horario: item.textoHorario,
      indicadorPermissaoCancelar: podeCancelarConsulta(
        Util.formatarData(item.dataVinculo),
        item.textoHorario,
        item.indicadorConsultaCancelada
      ),
    }));

    res.send(resposta);
  } catch (erro) {
    logger.error('Falha na listagem das consultas do paciente', erro);
    res
      .status(400)
      .send({ mensagem: 'Falha na listagem das consultas do paciente' });
  }
};

const listarConsultaTodasProfissional = async (req, res) => {
  try {
    if (req.query.idProfissional === undefined) {
      res
        .status(400)
        .send({ mensagem: 'Número do profissional não foi informado' });
      return;
    }

    if (req.query.dataInicio === undefined) {
      res
        .status(400)
        .send({ mensagem: 'Data início da pesquisa não foi informada' });
      return;
    }

    if (!Util.isDataValida(req.query.dataInicio)) {
      res.status(400).send({ mensagem: 'Data início da pesquisa inválida' });
      return;
    }

    if (req.query.dataFim === undefined) {
      res
        .status(400)
        .send({ mensagem: 'Data fim da pesquisa não foi informada' });
      return;
    }

    if (!Util.isDataValida(req.query.dataFim)) {
      res.status(400).send({ mensagem: 'Data fim da pesquisa inválida' });
      return;
    }

    const intervaloTempo = Util.quantidadeDias(
      req.query.dataInicio,
      req.query.dataFim
    );

    if (intervaloTempo > 60) {
      res
        .status(400)
        .send({ mensagem: 'Intervalo de pesquisa superior a 60 dias' });
      return;
    }

    const lista = await db.sequelize.query(
      `
      SELECT  C."idProfissional" ,
              P."nomeProfissional" ,
              C."dataVinculo" ,
              C."idHorario" , 
              H."textoHorario" , 
              C."indicadorConsultaCancelada",
              PC."idPaciente",
              PC."nomePaciente"
      FROM   "Consulta" C , 
             "Profissional" P , 
             "Horario" H,
             "Paciente" PC
      WHERE  C."idProfissional" = P."idProfissional" 
      AND    H."idHorario" = C."idHorario"
      AND    PC."idPaciente" = C."idPaciente"
      AND    C."dataVinculo" BETWEEN '${Util.converterEmDataIso(
        req.query.dataInicio
      )}' 
      AND  '${Util.converterEmDataIso(req.query.dataFim)}'
      AND   C."indicadorConsultaCancelada" = 'N' 
      `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const resposta = _(lista).map((item) => ({
      idProfissional: item.idProfissional,
      nomeProfissional: item.nomeProfissional,
      idPaciente: item.idPaciente,
      nomePaciente: item.nomePaciente,
      dataConsulta: Util.formatarData(item.dataVinculo),
      idHorario: item.idHorario,
      horario: item.textoHorario,
      indicadorPermissaoCancelar: podeCancelarConsulta(
        Util.formatarData(item.dataVinculo),
        item.textoHorario,
        item.indicadorConsultaCancelada
      ),
    }));

    res.send(resposta);
  } catch (erro) {
    logger.error('Falha na listagem das consultas do profissional', erro);
    res
      .status(400)
      .send({ mensagem: 'Falha na listagem das consultas do profissional' });
  }
};

module.exports = {
  registrarMetodos,
  agendar,
  cancelar,
  listarConsulta,
  listarConsultaTodasPaciente,
  listarConsultaTodasProfissional,
  podeCancelarConsulta,
};
