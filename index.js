const express = require('express');
const router = express.Router();

router.use('/', require('./customer'));
router.use('/', require('./restaurant'));
router.use('/', require('./rider'));
router.use('/', require('./admin'));
router.use('/', require('./pages'));

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('joinOrderRoom', (trackId) => { socket.join(trackId); });
  });
  return router;
}