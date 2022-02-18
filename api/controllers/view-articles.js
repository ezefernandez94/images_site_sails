module.exports = {

    friendlyName: 'View Articles',

    description: 'Display "Articles" page.',

    exits: {

        success: {
            viewTemplatePath: 'pages/articles'
        }
    },

    fn: async function( inputs, exits ){
        
        // Respond with view
        const articles = await Articulo.find().populate('usuario')//.populate('comentario') // find - devuelve todos los registros de la tabla
        //console.log(articles)
        return exits.success({ articles: articles });
        //return exits.success();

    }

};