const { auth, db } = require('../config/firebaseAdmin');
const { Technician } = require('../models');

exports.index = async (req, res) => {
    const snapshot = await db.collection('usuarios').get();

    const usuarios = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
    }));

    const tecnicos = await Technician.findAll({
        where: { ativo: true },
        order: [['nome', 'ASC']]
    });

    res.render('users/index', {
        title: 'Gerenciar usuários',
        usuarios,
        tecnicos
    });
};

exports.update = async (req, res) => {
    const uid = req.params.uid;
    const { perfil, technicianId } = req.body;

    if (uid === req.usuario.uid) {
        return res.status(403).send(
            'Você não pode alterar seu próprio perfil.'
        );
    }

    if (!['user', 'tecnico', 'admin'].includes(perfil)) {
        return res.status(400).send('Perfil inválido.');
    }

    const referencia = db.collection('usuarios').doc(uid);

    if (!(await referencia.get()).exists) {
        return res.status(404).send('Usuário não encontrado.');
    }

    let tecnicoId = null;

    if (perfil === 'tecnico') {
        const tecnico = await Technician.findByPk(
            Number(technicianId)
        );

        if (!tecnico || !tecnico.ativo) {
            return res.status(400).send(
                'Selecione um técnico ativo.'
            );
        }

        tecnicoId = tecnico.id;
    }

    try {
        await db.runTransaction(async transaction => {
            if (tecnicoId !== null) {
                const vinculados = await transaction.get(
                    db.collection('usuarios')
                        .where('technicianId', '==', tecnicoId)
                );

                if (vinculados.docs.some(doc => doc.id !== uid)) {
                    const erro = new Error(
                        'Este técnico já está vinculado a outra conta.'
                    );

                    erro.status = 409;
                    throw erro;
                }
            }

            transaction.update(referencia, {
                perfil,
                technicianId: tecnicoId
            });
        });

    } catch (erro) {
        if (erro.status === 409) {
            return res.status(409).send(erro.message);
        }

        throw erro;
    }

    res.redirect(
        '/users?msg=' + encodeURIComponent('Perfil atualizado.')
    );
};

exports.destroy = async (req, res) => {
    const uid = req.params.uid;

    if (uid === req.usuario.uid) {
        return res.status(403).send(
            'Você não pode excluir sua própria conta.'
        );
    }

    try {
        await auth.deleteUser(uid);
    } catch (erro) {
        if (erro.code !== 'auth/user-not-found') {
            throw erro;
        }
    }

    await db.collection('usuarios').doc(uid).delete();

    res.redirect(
        '/users?msg=' + encodeURIComponent('Usuário excluído.')
    );
};