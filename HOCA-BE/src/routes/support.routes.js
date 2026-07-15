const controller = require('../controllers/support.controller');
const { protect, admin } = require('../middlewares/auth.middleware');
module.exports = async (fastify) => {
  fastify.post('/', { preHandler: [protect] }, controller.create);
  fastify.get('/mine', { preHandler: [protect] }, controller.mine);
  fastify.get('/admin', { preHandler: [protect, admin] }, controller.adminList);
  fastify.get('/:id', { preHandler: [protect] }, controller.getOne);
  fastify.post('/:id/reply', { preHandler: [protect] }, controller.replyTicket);
  fastify.patch('/:id/status', { preHandler: [protect, admin] }, controller.setStatus);
};
