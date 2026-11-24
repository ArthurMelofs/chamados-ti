const express = require("express");
const { auth, db } = require("../config/firebaseAdmin");

const router = express.Router();

const duracaoSessao = 5 * 24 * 60 * 60 * 1000;

const opcoesCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
};

// Página de login
router.get("/login", (req, res) => {
    res.render("auth/login");
});

// Criar sessão autenticada
router.post("/sessionLogin", async (req, res) => {
    try {
        if (!req.is("application/json")) {
            return res.sendStatus(415);
        }

        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                erro: "Token não informado."
            });
        }

        const usuario = await auth.verifyIdToken(idToken, true);

        const agora = Math.floor(Date.now() / 1000);

        if (agora - usuario.auth_time > 300) {
            return res.status(401).json({
                erro: "Faça login novamente."
            });
        }

        const referencia = db.collection("usuarios").doc(usuario.uid);

        // Cria o perfil apenas se ainda não existir
        await db.runTransaction(async (transaction) => {
            const documento = await transaction.get(referencia);

            if (!documento.exists) {
                transaction.set(referencia, {
                    uid: usuario.uid,
                    nome: usuario.name || usuario.email,
                    email: usuario.email,
                    perfil: "user"
                });
            }
        });

        const sessionCookie = await auth.createSessionCookie(
            idToken,
            { expiresIn: duracaoSessao }
        );

        res.cookie("session", sessionCookie, {
            ...opcoesCookie,
            maxAge: duracaoSessao
        });

        res.json({ sucesso: true });

    } catch (erro) {
        console.error("Erro ao criar sessão:", erro);

        res.status(401).json({
            erro: "Não foi possível criar a sessão."
        });
    }
});

// Encerrar sessão
router.post("/sessionLogout", (req, res) => {
    res.clearCookie("session", opcoesCookie);
    res.json({ sucesso: true });
});

module.exports = router;