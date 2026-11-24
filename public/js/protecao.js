import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

async function encerrarSessao() {
    const resposta = await fetch("/sessionLogout", {
        method: "POST"
    });

    if (!resposta.ok) {
        throw new Error("Erro ao encerrar sessão.");
    }

    await signOut(auth);

    window.location.replace("/login");
}

onAuthStateChanged(auth, async (user) => {
    try {
        if (!user) {
            await encerrarSessao();
            return;
        }

        const referencia = doc(db, "usuarios", user.uid);
        const documento = await getDoc(referencia);

        if (!documento.exists()) {
            await encerrarSessao();
            return;
        }

        const dados = documento.data();

        const nomeUsuario = document.getElementById("nomeUsuario");
        const perfilUsuario = document.getElementById("perfilUsuario");

        if (nomeUsuario) {
            nomeUsuario.textContent = dados.nome || user.email;
        }

        if (perfilUsuario) {
            perfilUsuario.textContent = dados.perfil;
        }

        console.log("Usuário autenticado:", dados.nome);
        console.log("Perfil:", dados.perfil);

        if (dados.perfil !== "admin") {
            document.getElementById("nav-technicians")?.remove();
            document.getElementById("nav-categories")?.remove();
        }

    } catch (erro) {
        console.error("Erro de autenticação:", erro);

        try {
            await encerrarSessao();
        } catch (erroLogout) {
            console.error(erroLogout);
        }
    }
});

document.getElementById("sair")?.addEventListener("click", async () => {
    try {
        await encerrarSessao();
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível encerrar a sessão.");
    }
});