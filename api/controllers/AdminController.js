const path = require('path');
const fs = require('fs');
// const { exec } = require('child_process');

/**
 * SesionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  inicioSesion: async (peticion, respuesta) => {
    respuesta.view('pages/admin/inicio_sesion');
  },

  procesarInicioSesion: async (peticion, respuesta) => {
    let admin = await Admin.findOne({ email: peticion.body.email, contrasena: peticion.body.contrasena });
    if (admin && admin.activo === true) {
      peticion.session.admin = admin;
      peticion.session.cliente = undefined;
      peticion.addFlash('mensaje', 'Sesión de admin iniciada');
      return respuesta.redirect('/admin/principal');
    } else if (admin && admin.activo === false){
      peticion.addFlash('mensaje', 'Administrador deshabilitado');
      return respuesta.redirect('/admin/inicio-sesion');
    } else {
      peticion.addFlash('mensaje', 'Email o contraseña invalidos');
      return respuesta.redirect('/admin/inicio-sesion');
    }
  },

  principal: async (peticion, respuesta) => {
    if (!peticion.session || !peticion.session.admin) {
      peticion.addFlash('mensaje', 'Sesión inválida');
      return respuesta.redirect('/admin/inicio-sesion');
    }
    let fotos = await Foto.find().sort('id');
    respuesta.view('pages/admin/principal', { fotos });
  },

  cerrarSesion: async (peticion, respuesta) => {
    peticion.session.admin = undefined;
    peticion.addFlash('mensaje', 'Sesión finalizada');
    return respuesta.redirect('/');
  },

  agregarFoto: async (peticion, respuesta) => {
    respuesta.view('pages/admin/agregar_foto');
  },

  procesarAgregarFoto: async (peticion, respuesta) => {
    let foto = await Foto.create({
      titulo: peticion.body.titulo,
      activa: true
    }).fetch();
    peticion.file('foto').upload({}, async (error, archivos) => {
      if (archivos && archivos[0]) {
        let uploadPath = archivos[0].fd;
        let ext = path.extname(uploadPath);

        await fs.createReadStream(uploadPath).pipe(fs.createWriteStream(path.resolve(sails.config.appPath, `assets/images/fotos/${foto.id}${ext}`)));
        await Foto.update({ id: foto.id }, { contenido: `${foto.id}${ext}` });
        peticion.addFlash('mensaje', 'Foto agregada');
        return respuesta.redirect('/admin/principal');
      }
      peticion.addFlash('mensaje', 'No hay foto seleccionada');
      return respuesta.redirect('/admin/agregar-foto');
    });
  },

  desactivarFoto: async (peticion, respuesta) => {
    await Foto.update({id: peticion.params.fotoId}, {activa: false});
    peticion.addFlash('mensaje', 'Foto desactivada');
    return respuesta.redirect('/admin/principal');
  },

  activarFoto: async (peticion, respuesta) => {
    await Foto.update({id: peticion.params.fotoId}, {activa: true});
    peticion.addFlash('mensaje', 'Foto activada');
    return respuesta.redirect('/admin/principal');
  },

  clientes: async (peticion, respuesta) => {

    if (!peticion.session || !peticion.session.admin) {
      peticion.addFlash('mensaje', 'Sesión inválida');
      return respuesta.redirect('/admin/inicio-sesion');
    }
    let clientes = await Cliente.find().sort('id');
    respuesta.view('pages/admin/clientes', { clientes: clientes });

  },

  listarOrdenesCliente: async (peticion, respuesta) => {

    if (!peticion.session || !peticion.session.admin) {
      peticion.addFlash('mensaje', 'Sesión inválida');
      return respuesta.redirect('/admin/inicio-sesion');
    }
    // console.log(1);
    let ordenes = await Orden.find({  }).sort('id');
    // console.log(ordenes);
    respuesta.view('pages/admin/ordenes_clientes', { ordenes: ordenes });
  },

  detalleOrden: async (peticion, respuesta) => {

    if (!peticion.session || !peticion.session.admin) {
      peticion.addFlash('mensaje', 'Sesión inválida');
      return respuesta.redirect('/admin/inicio-sesion');
    }

    let consulta = `
      SELECT
        titulo,
        contenido
      FROM
        orden_detalle
      INNER JOIN foto ON orden_detalle.foto_id = foto.id
      WHERE orden_detalle.orden_id = ` + peticion.params.ordenId;
    // console.log(consulta);
    await OrdenDetalle.getDatastore().sendNativeQuery(consulta, [], (errores, resultado) => {
      // console.log(resultado);
      let detalle = resultado.rows;
      respuesta.view('pages/admin/detalle_orden', { detalle });
    });

  },

  desactivarCliente: async (peticion, respuesta) => {
    await Cliente.update({id: peticion.params.clienteId}, {activo: false});
    peticion.addFlash('mensaje', 'Cliente desactivado');
    return respuesta.redirect('/admin/clientes');
  },

  activarCliente: async (peticion, respuesta) => {
    await Cliente.update({id: peticion.params.clienteId}, {activo: true});
    peticion.addFlash('mensaje', 'Cliente activado');
    return respuesta.redirect('/admin/clientes');
  },

  administradores: async (peticion, respuesta) => {

    if (!peticion.session || !peticion.session.admin) {
      peticion.addFlash('mensaje', 'Sesión inválida');
      return respuesta.redirect('/admin/inicio-sesion');
    }
    let administradores = await Admin.find().sort('id');
    respuesta.view('pages/admin/administradores', { administradores });

  },

  desactivarAdmin: async (peticion, respuesta) => {
    await Admin.update({id: peticion.params.adminId}, {activo: false});
    peticion.addFlash('mensaje', 'Administrador desactivado');
    return respuesta.redirect('/admin/administradores');
  },

  activarAdmin: async (peticion, respuesta) => {
    await Admin.update({id: peticion.params.adminId}, {activo: true});
    peticion.addFlash('mensaje', 'Administrador activado');
    return respuesta.redirect('/admin/administradores');
  },

  dashboard: async (peticion, respuesta) => {

    if (!peticion.session || !peticion.session.admin) {
      peticion.addFlash('mensaje', 'Sesión inválida');
      return respuesta.redirect('/admin/inicio-sesion');
    }

    let consultaFotos = `SELECT COUNT (id) AS cantidad FROM foto`;
    let consultaClientes = `SELECT COUNT (id) AS cantidad FROM cliente`;
    let consultaAdministradores = `SELECT COUNT (id) AS cantidad FROM admin`;
    let consultaOrdenes = `SELECT COUNT (id) AS cantidad FROM orden`;
    let resumen = new Map();

    await Orden.getDatastore().sendNativeQuery(consultaOrdenes, [], (errorOrden, resultadoOrden) => {
      // let detalle = resultado.rows;
      // console.log(resultadoOrden.rows[0]);
      resumen.set('ordenes', resultadoOrden.rows[0].cantidad);
      Admin.getDatastore().sendNativeQuery(consultaAdministradores, [], (errorAdmin, resultadoAdmin) => {
        // let detalle = resultado.rows;
        // console.log(resultadoAdmin);
        resumen.set('administradores', resultadoAdmin.rows[0].cantidad);
        Cliente.getDatastore().sendNativeQuery(consultaClientes, [], (errorCliente, resultadoCliente) => {
          // let detalle = resultado.rows;
          // console.log(resultadoCliente);
          resumen.set('clientes', resultadoCliente.rows[0].cantidad);
          Foto.getDatastore().sendNativeQuery(consultaFotos, [], (errorFotos, resultadoFotos) => {
            // let detalle = resultado.rows;
            // console.log(resultadoFotos);
            resumen.set('fotos', resultadoFotos.rows[0].cantidad);
            // console.log(resumen);
            respuesta.view('pages/admin/dashboard', { resumen });
          });
        });
      });
    });
  },

};

