const { auth, db } = require('../config/firebaseAdmin');
const { Technician } = require('../models');

async function exigirLogin(req, res, next) {
    try {
        const sessionCookie = req.cookies.session;

        if (!sessionCookie) {
            return res.redirect('/login');
        }

        const usuario = await auth.verifySessionCookie(
            sessionCookie,
            true
        );

        const documento = await db
            .collection('usuarios')
            .doc(usuario.uid)
            .get();

        if (!documento.exists) {
            res.clearCookie('session');
            return res.redirect('/login');
        }

        req.usuario = {
            ...documento.data(),
            uid: usuario.uid
        };

        if (req.usuario.perfil === 'tecnico') {
            const tecnico = req.usuario.technicianId
                ? await Technician.findByPk(req.usuario.technicianId)
                : null;

            if (!tecnico || !tecnico.ativo) {
                req.usuario.technicianId = null;
            }
        }

        res.locals.usuario = req.usuario;

        next();

    } catch (erro) {
        console.error('Erro de autenticação:', erro);

        res.clearCookie('session');

        return res.redirect('/login');
    }
}

function exigirAdmin(req, res, next) {
    if (!req.usuario || req.usuario.perfil !== 'admin') {
        return res.status(403).send(
            'Acesso negado. Você não possui permissão.'
        );
    }

    next();
}

module.exports = {
    exigirLogin,
    exigirAdmin
};