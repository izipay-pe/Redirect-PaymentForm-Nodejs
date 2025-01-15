const express = require ('express');
const router = express.Router();
const crypto = require('crypto');
const keys = require("../keys/keys");

const shopID = keys.SHOP_ID;
const key = keys.KEY;

function dataForm (parameters) {
    const newParams = {
        vads_action_mode: "INTERACTIVE",
        vads_ctx_mode: "TEST", // TEST O PRODUCTION
        vads_page_action: "PAYMENT",
        vads_payment_config: "SINGLE",
        vads_url_success: "http://127.0.0.1:3000/result",
        vads_return_mode: "POST",
        vads_site_id: shopID,
        vads_cust_first_name: parameters.firstName,
        vads_cust_last_name: parameters.lastName,
        vads_cust_email: parameters.email,
        vads_cust_cell_phone: parameters.phoneNumber,
        vads_cust_address: parameters.address,
        vads_cust_country: parameters.country,
        vads_cust_state: parameters.state,
        vads_cust_city: parameters.city,
        vads_cust_zip: parameters.zipCode,
        vads_order_id: parameters.orderId,
        vads_amount: Math.round(Number(parameters.amount) * 100), // Convertir monto a entero
        vads_currency: parameters.currency,
        vads_cust_national_id: parameters.identityCode,
        vads_trans_date: new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14),
        vads_trans_id: (Date.now() % 1000000).toString().padStart(6, '0'),
        vads_version: "V2",
        vads_redirect_success_timeout: "5",
    };
    
    newParams.signature = calculateSignature(newParams);

    return newParams;
}

function calculateSignature(parameters) {
    let contentSignature = '';
  
    const sortedParams = Object.keys(parameters).sort().reduce((result, key) => {
      result[key] = parameters[key];
      return result;
    }, {});
  
    for (const name in sortedParams) {
      if (name.startsWith('vads_')) {
        contentSignature += sortedParams[name] + '+';
      }
    }
  
    contentSignature += key;
  
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(contentSignature, 'utf8');
    const signature = hmac.digest('base64');

    return signature;
}

function checkSignature(parameters) {
    const signature = parameters.signature;

    return signature == calculateSignature(parameters);
}

module.exports = {dataForm, checkSignature};