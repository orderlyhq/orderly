const CLOUDINARY_CLOUD_NAME = "dwhnmibq";
const CLOUDINARY_UPLOAD_PRESET = "orderly-upload";

const URL =
`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


export async function uploadLogoEmpresa(
    arquivo,
    empresaId
){

if(!arquivo){
    throw new Error("ARQUIVO_NAO_INFORMADO");
}


const formData = new FormData();


formData.append(
    "file",
    arquivo
);


formData.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
);


formData.append(
    "folder",
    `orderly/empresas/${empresaId}`
);


formData.append(
    "public_id",
    "logo"
);


const response = await fetch(
    URL,
    {
        method:"POST",
        body:formData
    }
);


const data = await response.json();


if(!response.ok){

console.error(
"Erro Cloudinary:",
data
);

throw new Error(
data?.error?.message ||
"Erro upload logo"
);

}


return {
url:data.secure_url,
publicId:data.public_id
};


}