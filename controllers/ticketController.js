const { Op } = require('sequelize');
const { Ticket, Technician, Category, Comment } = require('../models');
const { STATUS, PRIORIDADES } = require('../config/constants');
const { validationMessages } = require('../utils/helpers');

const {
    isAdmin,
    filtroUsuario,
    podeAtender,
    podeEditar
} = require('../utils/ticketPermissions');

const include = [
    { model: Category, as: 'categoria' },
    { model: Technician, as: 'tecnico' },
];

function pickTicket(body) {
    return {
        titulo: (body.titulo || '').trim(),
        descricao: (body.descricao || '').trim(),
        solicitante: (body.solicitante || '').trim(),
        emailSolicitante: (body.emailSolicitante || '').trim() || null,
        setor: body.setor || null,
        prioridade: body.prioridade || 'media',
        status: body.status || 'aberto',
        categoryId: body.categoryId || null,
        technicianId: body.technicianId || null,
    };
}

async function formOptions() {
    const [categorias, tecnicos] = await Promise.all([
        Category.findAll({
            order: [['nome', 'ASC']]
        }),

        Technician.findAll({
            where: { ativo: true },
            order: [['nome', 'ASC']]
        }),
    ]);

    return { categorias, tecnicos };
}

async function findOr404(req, res, opts = {}) {
    const ticket = await Ticket.findOne({
        ...opts,
        where: {
            id: req.params.id,
            ...filtroUsuario(req.usuario)
        }
    });

    if (!ticket) {
        res.status(404).render('404', {
            title: 'Chamado não encontrado'
        });
    }

    return ticket;
}

// Listar chamados
exports.index = async (req, res) => {
    const { q, status, prioridade, categoria, tecnico } = req.query;

    const where = filtroUsuario(req.usuario);

    if (q) {
        const like = { [Op.like]: `%${q}%` };

        const or = [
            { titulo: like },
            { solicitante: like },
            { descricao: like }
        ];

        const idMatch = String(q).match(/^(?:CH-)?0*(\d+)$/i);

        if (idMatch) {
            or.push({ id: Number(idMatch[1]) });
        }

        where[Op.and] = [{ [Op.or]: or }];
    }

    if (status === 'ativos') {
        where.status = {
            [Op.in]: ['aberto', 'em_andamento', 'aguardando']
        };
    } else if (status && STATUS[status]) {
        where.status = status;
    }

    if (prioridade && PRIORIDADES[prioridade]) {
        where.prioridade = prioridade;
    }

    if (categoria) {
        where.categoryId = categoria;
    }

    if (tecnico === 'nenhum') {
        where.technicianId = null;
    } else if (tecnico) {
        where.technicianId = tecnico;
    }

    const tickets = await Ticket.findAll({
        where,
        include,
        order: [['createdAt', 'DESC']]
    });

    const opts = await formOptions();

    res.render('tickets/index', {
        title: 'Chamados',
        tickets,
        filtros: {
            q: q || '',
            status: status || '',
            prioridade: prioridade || '',
            categoria: categoria || '',
            tecnico: tecnico || ''
        },
        ...opts
    });
};

// Formulário de novo chamado
exports.new = async (req, res) => {
    res.render('tickets/form', {
        title: 'Novo chamado',
        ticket: {
            prioridade: 'media',
            status: 'aberto',
            solicitante: req.usuario.nome || req.usuario.email,
            emailSolicitante: req.usuario.email
        },
        errors: [],
        isEdit: false,
        ...(await formOptions())
    });
};

// Criar chamado
exports.create = async (req, res) => {
    const data = pickTicket(req.body);

    data.usuarioUid = req.usuario.uid;
    data.solicitante = req.usuario.nome || req.usuario.email;
    data.emailSolicitante = req.usuario.email;

    if (!isAdmin(req.usuario)) {
        data.status = 'aberto';
        data.technicianId = null;
    }

    try {
        const ticket = await Ticket.create(data);

        await Comment.create({
            ticketId: ticket.id,
            autor: 'Sistema',
            tipo: 'sistema',
            mensagem: `Chamado aberto por ${ticket.solicitante}.`
        });

        res.redirect(
            `/tickets/${ticket.id}?msg=${encodeURIComponent(
                `Chamado ${ticket.protocolo} criado com sucesso!`
            )}`
        );

    } catch (err) {
        const errors = validationMessages(err);

        if (!errors) throw err;

        res.status(422).render('tickets/form', {
            title: 'Novo chamado',
            ticket: data,
            errors,
            isEdit: false,
            ...(await formOptions())
        });
    }
};

// Visualizar chamado
exports.show = async (req, res) => {
    const ticket = await findOr404(req, res, {
        include: [
            ...include,
            { model: Comment, as: 'comentarios' }
        ],
        order: [[
            { model: Comment, as: 'comentarios' },
            'createdAt',
            'ASC'
        ]]
    });

    if (!ticket) return;

    const { tecnicos } = await formOptions();

    res.render('tickets/show', {
        title: ticket.protocolo,
        ticket,
        tecnicos,
        errors: [],
        podeAtender: podeAtender(req.usuario, ticket),
        podeEditar: podeEditar(req.usuario, ticket)
    });
};

// Formulário de edição
exports.edit = async (req, res) => {
    const ticket = await findOr404(req, res);

    if (!ticket) return;

    if (!podeEditar(req.usuario, ticket)) {
        return res.status(403).send('Acesso negado.');
    }

    res.render('tickets/form', {
        title: `Editar ${ticket.protocolo}`,
        ticket,
        errors: [],
        isEdit: true,
        ...(await formOptions())
    });
};

// Atualizar chamado
exports.update = async (req, res) => {
    const ticket = await findOr404(req, res);

    if (!ticket) return;

    if (!podeEditar(req.usuario, ticket)) {
        return res.status(403).send('Acesso negado.');
    }

    const data = pickTicket(req.body);

    data.solicitante = ticket.solicitante;
    data.emailSolicitante = ticket.emailSolicitante;

    if (!isAdmin(req.usuario)) {
        data.status = ticket.status;
        data.technicianId = ticket.technicianId;
        data.prioridade = ticket.prioridade;
    }

    try {
        await ticket.update(data);

        res.redirect(
            `/tickets/${ticket.id}?msg=${encodeURIComponent(
                'Chamado atualizado.'
            )}`
        );

    } catch (err) {
        const errors = validationMessages(err);

        if (!errors) throw err;

        res.status(422).render('tickets/form', {
            title: `Editar ${ticket.protocolo}`,
            ticket: {
                ...data,
                id: ticket.id,
                protocolo: ticket.protocolo
            },
            errors,
            isEdit: true,
            ...(await formOptions())
        });
    }
};

// Atendimento e atualização rápida
exports.quickUpdate = async (req, res) => {
    const ticket = await findOr404(req, res, { include });

    if (!ticket) return;

    if (!podeAtender(req.usuario, ticket)) {
        return res.status(403).send('Acesso negado.');
    }

    const historico = [];
    const { status, prioridade } = req.body;

    if (status && !Object.hasOwn(STATUS, status)) {
        return res.status(400).send('Status inválido.');
    }

    if (status && status !== ticket.status) {
        historico.push(
            `Status alterado de "${STATUS[ticket.status].label}" para "${STATUS[status].label}".`
        );

        ticket.status = status;
    }

    // Somente administradores podem alterar
    // prioridade e atribuir responsáveis
    if (isAdmin(req.usuario)) {

        if (
            prioridade &&
            Object.hasOwn(PRIORIDADES, prioridade) &&
            prioridade !== ticket.prioridade
        ) {
            historico.push(
                `Prioridade alterada para "${PRIORIDADES[prioridade].label}".`
            );

            ticket.prioridade = prioridade;
        }

        if (Object.hasOwn(req.body, 'technicianId')) {
            const technicianId = req.body.technicianId
                ? Number(req.body.technicianId)
                : null;

            if (
                technicianId !== null &&
                (!Number.isInteger(technicianId) || technicianId <= 0)
            ) {
                return res.status(400).send('Técnico inválido.');
            }

            if (technicianId !== ticket.technicianId) {

                const novo = technicianId
                    ? await Technician.findByPk(technicianId)
                    : null;

                if (technicianId && (!novo || !novo.ativo)) {
                    return res.status(400).send('Técnico inválido.');
                }

                ticket.technicianId = novo ? novo.id : null;

                historico.push(
                    novo
                        ? `Chamado atribuído a ${novo.nome}.`
                        : 'Técnico responsável removido.'
                );
            }
        }
    }

    if (!historico.length) {
        return res.redirect(
            `/tickets/${ticket.id}?erro=${encodeURIComponent(
                'Nenhuma alteração realizada.'
            )}`
        );
    }

    await ticket.save();

    await Comment.bulkCreate(
        historico.map(mensagem => ({
            ticketId: ticket.id,
            autor: req.usuario.nome || req.usuario.email,
            tipo: 'sistema',
            mensagem
        }))
    );

    res.redirect(
        `/tickets/${ticket.id}?msg=${encodeURIComponent(
            'Chamado atualizado.'
        )}`
    );
};

// Excluir chamado
exports.destroy = async (req, res) => {
    const ticket = await findOr404(req, res);

    if (!ticket) return;

    if (!podeEditar(req.usuario, ticket)) {
        return res.status(403).send('Acesso negado.');
    }

    const protocolo = ticket.protocolo;

    await ticket.destroy();

    res.redirect(
        `/tickets?msg=${encodeURIComponent(
            `Chamado ${protocolo} excluído.`
        )}`
    );
};