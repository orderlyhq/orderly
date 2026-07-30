import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    collection,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



export async function cadastrarEmpresa(dados) {


    if (dados.senha !== dados.confirmarSenha) {

        throw new Error("SENHAS_DIFERENTES");

    }



    /*
      1.
      Criar usuário administrador
    */

    const usuarioCredential =
        await createUserWithEmailAndPassword(
            auth,
            dados.emailAdmin,
            dados.senha
        );


    const uid =
        usuarioCredential.user.uid;



    /*
      2.
      Criar empresa
    */


    const empresaRef =
        doc(collection(db, "empresas"));


    const empresaId =
        empresaRef.id;



    await setDoc(empresaRef, {


        nomeFantasia:
            dados.nomeFantasia,


        razaoSocial:
            dados.razaoSocial || "",


        cnpj:
            dados.cnpj || "",


        email:
            dados.emailEmpresa,


        telefone:
            dados.telefone,


        whatsapp:
            dados.whatsapp,


        endereco:
            dados.endereco,


        cidade:
            dados.cidade,


        estado:
            dados.estado,


        ativo: true,


        plano: "free",


        criadoEm:
            serverTimestamp()


    });



    /*
      3.
      Criar usuário administrador
    */


    await setDoc(
        doc(
            db,
            "empresas",
            empresaId,
            "usuarios",
            uid
        ),
        {

            uid:
                uid,


            nome:
                dados.nomeAdmin,


            email:
                dados.emailAdmin,


            tipo:
                "ADMIN",


            criadoEm:
                serverTimestamp()

        }
    );



    /*
      4.
      Criar configurações iniciais
    */


    await setDoc(
        doc(
            db,
            "empresas",
            empresaId,
            "configuracoes",
            "geral"
        ),
        {


            loja: {

                nome:
                    dados.nomeFantasia,

                telefone: "",

                whatsapp: "",

                email: ""

            },


            funcionamento: {

                abertura: "",

                fechamento: "",

                statusManual:
                    "AUTO"

            },


            delivery: {

                ativo: true,

                retirada: true

            },


            pagamentos: [

                {

                    id: "pix",

                    nome: "PIX",

                    ativo: true

                },


                {

                    id: "dinheiro",

                    nome: "Dinheiro",

                    ativo: true

                },


                {

                    id: "cartao",

                    nome: "Cartão",

                    ativo: true

                }

            ]

        }
    );



    return {

        empresaId,

        uid

    };


}