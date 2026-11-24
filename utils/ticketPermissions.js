const { Op } = require('sequelize');

function isAdmin(usuario) {
    return usuario?.perfil === 'admin';
}

function isTecnico(usuario) {
    return usuario?.perfil === 'tecnico';
}

function filtroUsuario(usuario) {
    if (!usuario?.uid) {
        throw new Error('Usuário não autenticado.');
    }

    if (isAdmin(usuario)) {
        return {};
    }

    if (isTecnico(usuario) && usuario.technicianId) {
        return {
            [Op.or]: [
                { usuarioUid: usuario.uid },
                { technicianId: usuario.technicianId }
            ]
        };
    }

    return {
        usuarioUid: usuario.uid
    };
}

function podeAtender(usuario, ticket) {
    return isAdmin(usuario) || (
        isTecnico(usuario) &&
        usuario.technicianId &&
        Number(usuario.technicianId) === Number(ticket.technicianId)
    );
}

function podeEditar(usuario, ticket) {
    return isAdmin(usuario) ||
        ticket.usuarioUid === usuario.uid;
}

module.exports = {
    isAdmin,
    isTecnico,
    filtroUsuario,
    podeAtender,
    podeEditar
};