const config = require('config');
const ChesService = require('./chesService');

const getService = () => {
  const clientConfig = config.get('services.ches');
  const chesService = new ChesService(clientConfig);
  return chesService;
};

const healthCheck = async (req, res, next) => {
  const svc = getService();
  try {
    const response = await svc.health();
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const getStatus = async (req, res, next) => {
  const svc = getService();
  try {
    let params = req.query;
    params.fields = 'delayTS%2CcreatedTimestamp%2CupdatedTimestamp';
    const response = await svc.status(params);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const cancelDelayed = async (req, res, next) => {
  const svc = getService();
  try {
    const response = await svc.cancel(req.query);
    res.status(202).json(response);
  } catch (error) {
    next(error);
  }
};

const sendEmail = async (req, res, next) => {
  const svc = getService();
  let email = {};
  try {
    email = req.body;

    const response = await svc.send(email);
    // for now just assume that we are getting 200
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};


const emailMerge = async (req, res, next) => {
  const svc = getService();
  let data = {};
  try {
    data = req.body;

    const response = await svc.merge(data);
    // for now just assume that we are getting 200
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};


const emailPreview = async (req, res, next) => {
  const svc = getService();
  let data = {};
  try {
    data = req.body;

    const response = await svc.preview(data);
    // for now just assume that we are getting 200
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {healthCheck, getStatus, cancelDelayed, sendEmail, emailMerge, emailPreview};
