const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const path = require("path");

const chromePath = path.join(
    process.env.USERPROFILE,
    ".cache",
    "puppeteer",
    "chrome",
    "win64-150.0.7871.24",
    "chrome-win64",
    "chrome.exe"
);

console.log("[WHATSAPP] Chrome:", chromePath);

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "orderly"
    }),

    puppeteer: {
        headless: true,
        executablePath: chromePath,

        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
        ]
    }
});

let iniciado = false;

function iniciarWhatsapp() {

    if (iniciado) {
        console.log("[WHATSAPP] Cliente já foi iniciado.");
        return;
    }

    iniciado = true;

    console.log("[WHATSAPP] Iniciando cliente...");

    client.on("qr", async (qr) => {

        console.log("[WHATSAPP] QR Code recebido.");

        try {

            await qrcode.toFile(
                "./whatsapp-qr.png",
                qr
            );

            console.log(
                "[WHATSAPP] QR Code salvo em: ./whatsapp-qr.png"
            );

        } catch (error) {

            console.error(
                "[WHATSAPP] Erro ao gerar QR Code:",
                error
            );

        }
    });

    client.on("ready", () => {

        console.log(
            "[WHATSAPP] Cliente conectado e pronto."
        );

    });

    client.on("authenticated", () => {

        console.log(
            "[WHATSAPP] Autenticado."
        );

    });

    client.on("auth_failure", (error) => {

        console.error(
            "[WHATSAPP] Falha na autenticação:",
            error
        );

    });

    client.on("disconnected", (reason) => {

        console.warn(
            "[WHATSAPP] Desconectado:",
            reason
        );

        iniciado = false;
    });

    client.on("message", async (message) => {

        console.log(
            `[WHATSAPP] Mensagem de ${message.from}: ${message.body}`
        );

    });

    client.initialize();
}

module.exports = {
    iniciarWhatsapp,
    client
};