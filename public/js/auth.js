import { auth } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const form = document.getElementById("formAuth");
const mensagem = document.getElementById("mensagem");

// Mensagens de erro
const erros = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/weak-password": "A senha é muito fraca.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
    "auth/unauthorized-domain": "Domínio não autorizado no Firebase.",
    "permission-denied": "Acesso negado pelo Firestore."
};

function mostrarerro(erro) {
    console.error(erro);

    mensagem.textContent =
        erros[erro.code] ||
        erro.message ||
        "Ocorreu um erro inesperado.";
}

// Criação da sessão no backend
async function finalizarlogin(user) {
    const idToken = await user.getIdToken(true);

    const resposta = await fetch("/sessionLogin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.erro || "Erro ao criar sessão."
        );
    }

    window.location.replace("/");
}

// LOGIN COM E-MAIL E SENHA
form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensagem.textContent = "";

    try {
        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;

        const resultado = await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

        await finalizarlogin(resultado.user);

    } catch (erro) {
        mostrarerro(erro);
    }
});

// CADASTRO DE USUÁRIO
document.getElementById("cadastrar").addEventListener("click", async (evento) => {
    evento.preventDefault();
    mensagem.textContent = "";

    try {
        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;

        if (!nome) {
            mensagem.textContent = "Por favor, informe seu nome!";
            return;
        }

        const resultado = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        await updateProfile(resultado.user, {
            displayName: nome
        });

        await finalizarlogin(resultado.user);

    } catch (erro) {
        mostrarerro(erro);
    }
});

// LOGIN COM GOOGLE
document.getElementById("google").addEventListener("click", async (evento) => {
    evento.preventDefault();
    mensagem.textContent = "";

    try {
        const provider = new GoogleAuthProvider();

        const resultado = await signInWithPopup(
            auth,
            provider
        );

        await finalizarlogin(resultado.user);

    } catch (erro) {
        mostrarerro(erro);
    }
});