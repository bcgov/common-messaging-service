const config = require('config');
const ChesService = require('./chesService');

const getService = () => {
  const clientConfig = config.get('services.ches');
  const chesService = new ChesService(clientConfig);
  return chesService;
};

const sendEmail = async (req, res, next) => {
  const svc = getService();
  let email = {};
  try {
    email = req.body;

    let response = await svc.send(email);
    // for now just assume that we are getting 200
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {sendEmail};
