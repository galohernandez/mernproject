const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Token = require("../models/tokenModel");

module.exports = async (user, mailtype) => {
  // const routeForUi =
  //   mailtype === "verifyemail" ? "verifyemail" : "resetpassword";
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
      user: "galohernandez@gmail.com",
      pass: "ssddcxagjbkbkvte",
    },
  });

  const encryptedToken = bcrypt
    .hashSync(user._id.toString(), 10)
    .replaceAll("/", ""); //10 es el nivel de salt
  const token = new Token({
    userid: user._id,
    token: encryptedToken,
  }); // por seguridad no se debe tener en el backend ningun simbolo de slash, se reemplaza por espacio vacio
  await token.save();

  //se chequea si se va a verificar correo o se va a resetear el password
  //como voy usar dos veces uso let
  let emailContent, mailOptions;

  if (mailtype == "verifyemail") {
    emailContent = `
  <div>
  <h1>Please click on the link below to verify your email address</h1>
  <a href="http://localhost:3000/verifyemail/${encryptedToken}">LINK</a>
  </div>
  `;

    mailOptions = {
      from: "galohernandez@gmail.com",
      to: user.email,
      subject: "Verify Email",
      html: emailContent,
    };
  } else if (mailtype == "resetpassword") {
    emailContent = `
  <div>
  <h1>Please click on the link below to reset your password</h1>
  <a href="http://localhost:3000/resetpassword/${encryptedToken}">LINK</a>
  </div>
  `;

    mailOptions = {
      from: "galohernandez@gmail.com",
      to: user.email,
      subject: "Reset Password",
      html: emailContent,
    };
  } else {
    console.log("Fallo en envio...");
  }

  await transporter.sendMail(mailOptions);
};
