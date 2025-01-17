<p align="center">
  <img src="https://github.com/izipay-pe/Imagenes/blob/main/logos_izipay/logo-izipay-banner-1140x100.png?raw=true" alt="Formulario" width=100%/>
</p>

# Redirect-PaymentForm-NodeJS

## Índice

➡️ [1. Introducción](#-1-introducci%C3%B3n)  
🔑 [2. Requisitos previos](#-2-requisitos-previos)  
🚀 [3. Ejecutar ejemplo](#-3-ejecutar-ejemplo)  
🔗 [4. Pasos de integración](#4-pasos-de-integraci%C3%B3n)  
💻 [4.1. Desplegar pasarela](#41-desplegar-pasarela)  
💳 [4.2. Analizar resultado de pago](#42-analizar-resultado-del-pago)  
📡 [4.3. Pase a producción](#43pase-a-producci%C3%B3n)  
🎨 [5. Personalización](#-5-personalizaci%C3%B3n)  
📚 [6. Consideraciones](#-6-consideraciones)

## ➡️ 1. Introducción

En este manual podrás encontrar una guía paso a paso para configurar un proyecto de **[NodeJS]** con la pasarela de pagos de IZIPAY. Te proporcionaremos instrucciones detalladas y credenciales de prueba para la instalación y configuración del proyecto, permitiéndote trabajar y experimentar de manera segura en tu propio entorno local.
Este manual está diseñado para ayudarte a comprender el flujo de la integración de la pasarela para ayudarte a aprovechar al máximo tu proyecto y facilitar tu experiencia de desarrollo.


<p align="center">
  <img src="https://github.com/izipay-pe/Imagenes/blob/main/formulario_redireccion/Imagen-Formulario-Redireccion.png?raw=true" alt="Formulario" width="750"/>
</p>

## 🔑 2. Requisitos Previos

- Comprender el flujo de comunicación de la pasarela. [Información Aquí](https://secure.micuentaweb.pe/doc/es-PE/form-payment/standard-payment/definir-pasos-de-pago-vista-del-vendedor.html)
- Extraer credenciales del Back Office Vendedor. [Guía Aquí](https://github.com/izipay-pe/obtener-credenciales-de-conexion)
- Para este proyecto se utiliza NodeJS v22.12.0.
- Para este proyecto utilizamos la herramienta Visual Studio Code.

> [!NOTE]
> Tener en cuenta que, para que el desarrollo de tu proyecto, eres libre de emplear tus herramientas preferidas.

## 🚀 3. Ejecutar ejemplo

### Clonar el proyecto
```sh
git clone https://github.com/izipay-pe/Redirect-PaymentForm-NodeJS
``` 

### Datos de conexión 

Reemplace **[CHANGE_ME]** con sus credenciales de `API formulario V1, V2` extraídas desde el Back Office Vendedor, revisar [Requisitos previos](#-2-requisitos-previos).

- Editar el archivo `keys/keys.js` en la ruta raíz:
```node
const keys = {
    // Identificador de la tienda
    "SHOP_ID" : "~ CHANGE_ME_USER_ID ~",

    // Clave de Test o Producción
    "KEY" : "~ CHANGE_ME_KEY ~"
}
```

### Ejecutar proyecto

1. Ejecuta el siguiente comando para instalar todas las dependencias necesarias:
```bash
npm install
```

2.  Iniciar la aplicación:
```bash
npm start
```

## 🔗4. Pasos de integración

<p align="center">
  <img src="https://i.postimg.cc/pT6SRjxZ/3-pasos.png" alt="Formulario" />
</p>

## 💻4.1. Desplegar pasarela
### Calcular la firma
Las claves de `Identificador de tienda` y `Clave de test o producción` se utilizan para calcular la firma junto a los parámetros de la compra por medio de la función `calculateSignature` y se añade al final de los parámetros. Podrás encontrarlo en el archivo `controllers/controller.js`.
```node
function dataForm (parameters) {
    const newParams = {
        vads_action_mode: "INTERACTIVE",
        vads_ctx_mode: "TEST", // TEST O PRODUCTION
        vads_page_action: "PAYMENT",
        vads_payment_config: "SINGLE",
        vads_url_success: "http://127.0.0.1:3000/result",
        ..
        ..
    };
    
    //Calcular la firma
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
```

ℹ️ Para más información: [Calcular la firma](https://secure.micuentaweb.pe/doc/es-PE/form-payment/standard-payment/calcular-la-firma.html)
### Redirección del comprador hacia la página de pago
Para desplegar la pasarela, crea un formulario **HTML** de tipo **POST** con el valor del **ACTION** con la url de servidor de la pasarela de pago y agregale los parámetros de pago como etiquetas `<input type="hidden" name="..." value="" />`. Como se muestra el ejemplo en la ruta del archivo `views/checkout.ejs`

```html
<!-- Formulario con los datos de pago -->
<form action="https://secure.micuentaweb.pe/vads-payment/" method="post">
  <!-- Inputs generados dinámicamente -->
  <input type="hidden" name="vads_action_mode" value="<%= parameters.vads_action_mode %>" />
  <input type="hidden" name="vads_amount" value="<%= parameters.vads_amount %>" />
  <input type="hidden" name="vads_ctx_mode" value="<%= parameters.vads_ctx_mode %>" />
  <input type="hidden" name="vads_currency" value="<%= parameters.vads_currency %>" />
  ..
  ..
  <input type="hidden" name="signature" value="<%= parameters.signature %>" />          
  <button class="btn btn-primary" type="submit" name="pagar">Pagar</button>
</form>	
```
ℹ️ Para más información: [Redirección del comprador hacia la página de pago](https://secure.micuentaweb.pe/doc/es-PE/form-payment/standard-payment/1redireccion-del-comprador-hacia-la-pagina-de-pago.html)

## 💳4.2. Analizar resultado del pago

### Procesar regreso a la tienda
Se configura el método `checkSignature` que se encargara de validar la firma, retornará un valor `true` o `false`. Podrás encontrarlo en el archivo `Controllers/McwPayment.cs`.

```node
function checkSignature(parameters) {
  const signature = parameters.signature;

  return signature == calculateSignature(parameters);
}
```

Se valida que la firma recibida es correcta en el archivo `controllers/paidController.cs`.

```node
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
```
En caso que la validación sea exitosa, se renderiza el template con los valores. Como se muestra en el archivo `views/result.ejs`.

```html
<p><strong>Estado:</strong> <%= data.vads_trans_status %></p>
<p><strong>Monto:</strong> <%= data.vads_currency === '604' ? 'PEN' : 'USD' %> <%= (data.vads_amount / 100).toFixed(2) %></p>
<p><strong>Order-id:</strong> <%= data.vads_order_id %></p>
```
ℹ️ Para más información: [Procesar el regreso a la tienda](https://secure.micuentaweb.pe/doc/es-PE/form-payment/standard-payment/procesar-el-regreso-a-la-tienda.html)

### IPN
La IPN es una notificación de servidor a servidor (servidor de Izipay hacia el servidor del comercio) que facilita información en tiempo real y de manera automática cuando se produce un evento, por ejemplo, al registrar una transacción.

Se realiza la verificación de la firma y se retorna la respuesta del estado del pago. Podrás encontrarlo en el archivo `controllers/paidController.js`.

```node
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
```

La ruta o enlace de la IPN debe ir configurada en el Backoffice Vendedor, en `Configuración -> Reglas de notificación -> URL de notificación al final del pago`

<p align="center">
  <img src="https://github.com/izipay-pe/Imagenes/blob/main/formulario_redireccion/Url-Notificacion-Redireccion.png?raw=true" alt="Url de notificacion en redireccion" width="650" />
</p>

ℹ️ Para más información: [Implementar IPN](https://secure.micuentaweb.pe/doc/es-PE/form-payment/standard-payment/implementar-la-ipn.html)

## 5. Transacción de prueba

Antes de poner en marcha su pasarela de pago en un entorno de producción, es esencial realizar pruebas para garantizar su correcto funcionamiento. 

Puede intentar realizar una transacción utilizando una tarjeta de prueba (en la parte inferior del formulario).

<p align="center">
  <img src="https://github.com/izipay-pe/Imagenes/blob/main/formulario_redireccion/Imagen-Formulario-Redireccion-testcard.png?raw=true" alt="Tarjetas de prueba" width="450"/>
</p>

- También puede encontrar tarjetas de prueba en el siguiente enlace. [Tarjetas de prueba](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/kb/test_cards.html)

## 📡4.3.Pase a producción

Reemplace **[CHANGE_ME]** con sus credenciales de PRODUCCIÓN `API formulario V1, V2` extraídas desde el Back Office Vendedor, revisar [Requisitos Previos](#-2-requisitos-previos).

- Editar el archivo `appsettings.json` en la ruta raíz:
```node
const keys = {
    // Identificador de la tienda
    "SHOP_ID" : "~ CHANGE_ME_USER_ID ~",

    // Clave de Test o Producción
    "KEY" : "~ CHANGE_ME_KEY ~"
}
```

- Editar el archivo `controllers/controller.js`, cambia el parámetro `vads_ctx_mode` a `PRODUCTION` y la ruta de `vads_url_success`:
```node
const newParams = {
      vads_action_mode: "INTERACTIVE",
      vads_ctx_mode: "PRODUCTION", // TEST O PRODUCTION
      vads_page_action: "PAYMENT",
      vads_payment_config: "SINGLE",
      vads_url_success: "[TUDIRECCION]/result",
      ..
      ..
      vads_redirect_success_timeout: "5",
  };
```

## 🎨 5. Personalización

Si deseas aplicar cambios específicos en la apariencia de la página de pago, puedes lograrlo mediante las opciones de personalización en el Backoffice. En este enlace [Personalización - Página de pago](https://youtu.be/hy877zTjpS0?si=TgSeoqw7qiaQDV25) podrá encontrar un video para guiarlo en la personalización.

<p align="center">
  <img src="https://github.com/izipay-pe/Imagenes/blob/main/formulario_redireccion/Personalizacion-formulario-redireccion.png?raw=true" alt="Personalizacion de formulario en redireccion"  width="750" />
</p>

## 📚 6. Consideraciones

Para obtener más información, echa un vistazo a:

- [Integración Formulario API](https://secure.micuentaweb.pe/doc/es-PE/form-payment/standard-payment/sitemap.html)
- [Lograr integración del Formulario API](https://secure.micuentaweb.pe/doc/es-PE/form-payment/quick-start-guide/sitemap.html)
