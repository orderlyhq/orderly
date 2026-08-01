const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(__dirname));


app.get("/:slug", (req,res)=>{
    res.sendFile(
        path.join(__dirname,"loja.html")
    );
});


app.listen(5500,()=>{
    console.log(
      "Servidor Orderly rodando na porta 5500"
    );
});