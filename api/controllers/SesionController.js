/**
 * SesionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  registro: async (peticion, respuesta) => {
    respuesta.view('pages/registro');
  },

  procesarRegistro: async (peticion, respuesta) => {
    let cliente = await Cliente.findOne({ email: peticion.body.email });
    if (cliente) {
      peticion.addFlash('mensaje', 'Email duplicado');
      return respuesta.redirect('/registro');
    }
    else {
      let cliente = await Cliente.create({
        email: peticion.body.email,
        nombre: peticion.body.nombre,
        contrasena: peticion.body.contrasena
      });
      peticion.session.cliente = cliente;
      peticion.addFlash('mensaje', 'Cliente registrado');
      return respuesta.redirect('/');
    }
  },

  inicioSesion: async (peticion, respuesta) => {
    respuesta.view('pages/inicio_sesion');
  },

  procesarInicioSesion: async (peticion, respuesta) => {
    let clienteData = await Cliente.findOne({ email: peticion.body.email });
    if (clienteData && clienteData.activo === true) {
      peticion.session.cliente = clienteData;
      let carroCompra = await CarroCompra.find({cliente: clienteData.id});
      peticion.session.carroCompra = carroCompra;
      peticion.addFlash('mensaje', 'Sesión iniciada');
      return respuesta.redirect('/');
    } else if (clienteData && clienteData.activo === false){
      peticion.addFlash('mensaje', 'Usuario deshabilitado');
      return respuesta.redirect('/inicio-sesion');
    } else {
      peticion.addFlash('mensaje', 'Email o contraseña invalidos');
      return respuesta.redirect('/inicio-sesion');
    }
  },

  cerrarSesion: async (peticion, respuesta) => {
    peticion.session.cliente = undefined;
    peticion.addFlash('mensaje', 'Sesión finalizada');
    return respuesta.redirect('/');
  },

};

