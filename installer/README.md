# Orderly Server Installer

Este diretório contém o instalador do servidor local do Orderly.

## Componentes

O instalador configura:

- Orderly HTTP Server
- WhatsApp
- Impressora térmica
- Bee Delivery
- APIs locais
- Inicialização automática do servidor

## Arquitetura

O servidor principal é:

server/bot.js

O bot.js é responsável pelo servidor HTTP e inicializa os demais componentes.

## Serviço Windows

Nome:

OrderlyServer

O serviço é configurado para iniciar automaticamente com o Windows.

## Estrutura

installer/

├─ OrderlyServer.iss
├─ build.ps1
├─ README.md
├─ bin/
│  └─ nssm.exe
└─ runtime/
   └─ node.exe

## Compilar

Execute:

PowerShell:

.\build.ps1

O instalador será criado em:

installer/output/OrderlyServerSetup.exe