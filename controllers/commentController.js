const { Ticket, Comment } = require('../models');
const { validationMessages } = require('../utils/helpers');
const { filtroUsuario } = require('../utils/ticketPermissions');

// POST /tickets/:id/comments
exports.create = async (req, res) => {

  // Verifica se o usuário pode acessar o chamado
  const ticket = await Ticket.findOne({
    where: {
      id: req.params.id,
      ...filtroUsuario(req.usuario)
    }
  });

  if (!ticket) {
    return res.status(404).render('404', {
      title: 'Chamado não encontrado'
    });
  }

  try {

    await Comment.create({
      ticketId: ticket.id,
      autor: req.usuario.nome || req.usuario.email,
      mensagem: (req.body.mensagem || '').trim(),
      tipo: 'comentario',
    });

    res.redirect(
      `/tickets/${ticket.id}?msg=${encodeURIComponent(
        'Comentário adicionado.'
      )}#comentarios`
    );

  } catch (err) {

    const errors = validationMessages(err);

    if (!errors) throw err;

    res.redirect(
      `/tickets/${ticket.id}?erro=${encodeURIComponent(
        errors.join(' ')
      )}#comentarios`
    );
  }
};