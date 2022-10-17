const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const Token = require("../models/tokenModel");

//creacion de endpoint para register , video 11
router.post("/register", async (req, res) => {
  try {
    //se chequea si existe user en base de datos antes de proceder
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser)
      return res
        .status(200)
        .send({ success: false, message: "User already registered" });

    //encryptacion de password con bcrypt
    const password = req.body.password;
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    //fin de escryptado
    const newuser = new User(req.body);
    const result = await newuser.save();
    await sendEmail(result, "verifyemail");
    res.status(200).send({
      success: true,
      message: "User registered successfully,. Please verify your email",
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

//creacion de endpoint para login
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
      // password: req.body.password,
    });
    if (user) {
      //decryptacion y comparacion con password normal
      const passwordMatched = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (passwordMatched) {
        //no se debe enviar el password al user, se escoge que se le va a enviar al user
        //esto se lo hace enviando encryptado por medio de JWT
        // -- se agrega de video email verification 2 un if para comprobar si  el  email ha sido verificado
        if (user.isVerified) {
          const dataToBeSentToFrontEnd = {
            _id: user._id,
            email: user.email,
            name: user.name,
          };
          const token = jwt.sign(dataToBeSentToFrontEnd, "SHEY", {
            expiresIn: 60 * 60,
          });
          res.status(200).send({
            success: true,
            message: "User login succesfull",
            data: token, // en vez de user envio el token
            // data: user,
          });
        } else {
          res
            .status(200)
            .send({ success: false, message: "Email not verified" });
        }
      } else
        res.status(200).send({ success: false, message: "PASSWORD INCORRECT" }); // se quita data:user
    } else {
      res
        .status(200)
        .send({ success: false, message: "User login failed", data: null });
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

//creacion del router post  - video email verification
router.post("/verifyemail", async (req, res) => {
  try {
    const tokenData = await Token.findOne({ token: req.body.token });
    if (tokenData) {
      await User.findOneAndUpdate({ _id: tokenData.userid, isVerified: true });
      await Token.findOneAndDelete({ token: req.body.token });
      res.send({ success: true, message: "Email Verified Successlly" });
    } else {
      res.send({ success: false, message: "Invalid token" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// creacion de ruta para reset-password
router.post("/resetpassword", async (req, res) => {
  try {
    const tokenData = await Token.findOne({ token: req.body.token });
    if (tokenData) {
      const password = req.body.password;
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.findOneAndUpdate({
        _id: tokenData.userid,
        password: hashedPassword,
      });
      await Token.findOneAndDelete({ token: req.body.token });
      res.send({ success: true, message: "Password Reset Successlly" });
    } else {
      res.send({ success: false, message: "Invalid token" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/send-password-reset-link", async (req, res) => {
  try {
    const result = await User.findOne({ _id: req.body.id });
    await sendEmail(result, "resetpassword");
    res.send({
      success: true,
      message: "Password reset link sent to your email succesfully",
    });
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

module.exports = router;
