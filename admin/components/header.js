import { buscarConfiguracoes } from "../../js/services/config.js";

export async function carregarHeader() {

  document.getElementById("header").innerHTML = `

<img 
  id="admin-logo-img" 
  class="admin-logo-img"
  src="" 
  alt="Logo da loja"
>

<div>

    <div class="user-name">
        Administrador
    </div>

    <small id="header-nome-loja">
        Restaurante
    </small>

</div>

`;

  const logo = document.getElementById("admin-logo-img");
  const nomeLoja = document.getElementById("header-nome-loja");


  const configuracao = await buscarConfiguracoes();


  console.log("CONFIG HEADER:", configuracao);


  if (configuracao?.logo?.url) {

    logo.src = configuracao.logo.url.replace(
      "/upload/",
      "/upload/w_80,h_80,c_fill,g_auto/",
    );

  }


  if (configuracao?.loja?.nome) {

    nomeLoja.textContent = configuracao.loja.nome;

  }

}