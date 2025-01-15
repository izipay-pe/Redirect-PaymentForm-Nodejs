const express = require ('express');
const router = express.Router();
const keys = require("../keys/keys");
const { dataForm, checkSignature } = require('./controller');
const controller = {};

controller.home = (req, res) => {
    res.render("index", { title: 'Demo NodeJS' })
}

controller.formulario = async (req, res) => {
    const checkoutParameters = req.body;

    parameters = dataForm(checkoutParameters);

    res.render("checkout", {parameters});
}

controller.paidResult = (req, res) => {
    if (Object.keys(req.body).length === 0){
        throw new Error('No post data received!');
    }

    // Validación de firma
    if (!checkSignature(req.body)){
        throw new Error('Invalid signature');
    }

    res.status(200).render("result", { 'data': req.body });
}

controller.ipn = (req, res) => {
    if (Object.keys(req.body).length === 0){
        throw new Error('No post data received!');
    }

    // Validación de firma en IPN
    if (!checkSignature(req.body)){
        throw new Error('Invalid signature');
    }

    //Verificar orderStatus: AUTHORISED
    const orderStatus = req.body['vads_trans_status'];
    const orderId = req.body['vads_order_id'];
    const transactionUuid = req.body['vads_trans_uuid'];

    res.status(200).send(`OK! OrderStatus is ${orderStatus}`);
}

module.exports = controller;