import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import serviceAccount from "../serviceAccountKey.json" with { type: "json" };


initializeApp({
  credential: cert(serviceAccount)
});


const db = getFirestore();



async function migrarUsuarios(){

  console.log("Iniciando migração...");


  const empresasSnap = await db
    .collection("empresas")
    .get();


  for(const empresaDoc of empresasSnap.docs){

    const empresaId = empresaDoc.id;


    const usuariosSnap = await db
      .collection("empresas")
      .doc(empresaId)
      .collection("usuarios")
      .get();



    for(const usuarioDoc of usuariosSnap.docs){

      const dados = usuarioDoc.data();

      const uid = usuarioDoc.id;



      await db
        .collection("usuarios")
        .doc(uid)
        .set({

          uid,

          empresaId,

          nome: dados.nome || "",

          email: dados.email || "",

          tipo: dados.tipo || "FUNCIONARIO",

          criadoEm:
            dados.criadoEm ||
            FieldValue.serverTimestamp()

        });



      console.log(
        "Migrado:",
        uid,
        "→",
        empresaId
      );

    }

  }


  console.log(
    "Migração concluída!"
  );

}



migrarUsuarios()
.catch((erro)=>{

console.error(
"Erro na migração:",
erro
);

process.exit(1);

});