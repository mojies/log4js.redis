const util = require( 'util' );
const redis = require("redis");


// function messagePassThroughLayout(loggingEvent) {
//   return util.format(...loggingEvent.data);
// }

let lvOutsideClient = null;
let lvInsideClient = null;
let lvLayout = null;
let lvCache = [];
/**
 * Returns a function to log data in mongodb.
 *
 * @param {string} config.host The redis host
 * @param {string} config.port The redis port
 * @param {Object} config.redisOption Option, If this parameters is exist, it
 * will ignore host and port, and you can set all redis params in this object
 * @returns {Function}
 */
function appender( config ){
    if( ( config == null )
     || ( ( config.redisOption == null )
       && ( ( config.host == null )
       || ( config.port == null ) ) )
     || ( config.dbIndex == null )
    ){
        throw new Error( 'Please provide full params' );
    }

    let tvReconnLoop = null;
    let tvReconnectTimes = 0;

    tfPersistenceCache = (  ) => {
        if( ( lvCache.length != 0 ) && ( lvOutsideClient ) ){

            let tvLen = lvCache.length;
            for( let i = 0; i < tvLen; i++ ){
                let tvDocument = lvCache.shift();

                lvOutsideClient.lpush( tvDocument.keys,
                tvDocument.document, ( err ) => {
                    if( err ){
                        lvCache.splice(0, 0, tvDocument);
                    }
                } );
            }
        }
    }

    tfConnectToRedis = () => {
        if( lvOutsideClient ) return;

        if( config.redisOption )
            lvInsideClient = redis.createClient( config.redisOption );
        else lvInsideClient = redis.createClient( config.port, config.host );

        // console.log( '-> connect' )
        lvInsideClient.on('connect', (err) => {
            // console.log( '-> connected' )
            if( tvReconnLoop )
                clearInterval( tvReconnLoop );
            tvReconnLoop = null;
            lvInsideClient.select( config.dbIndex, ( err, res ) => {
                if( err ){
                    tfConnectServerPerSeconds();
                    return;
                }
                lvOutsideClient = lvInsideClient;
                tfPersistenceCache();
            } );
        });

        lvInsideClient.on('reconnecting', (err) => {
            // console.log( '-> reconnecting' )
        } )

        lvInsideClient.on('error', (err) => {
            // console.log( '-> error' )
            lvOutsideClient = null;
            tfConnectServerPerSeconds();
        });


        lvInsideClient.on('end', (err) => {
            // console.log( '-> end' )
            lvOutsideClient = null;
            tfConnectServerPerSeconds();
        });

    }

    tfConnectServerPerSeconds = () => {

        if( tvReconnectTimes == 0 ){
            tfConnectToRedis();
            tvReconnectTimes++;
        }else{
            if( tvReconnLoop ) return;
            tvReconnectTimes++;
            tvReconnLoop = setInterval( () => {
                tfConnectToRedis();
            }, 20000 )
        }
    }

    tfConnectServerPerSeconds();

    // lvLayout = config.layout || messagePassThroughLayout ;

    return ( loggingEvent ) => {
        let tvDocument = JSON.stringify( loggingEvent );
        // console.log( `Document: ${tvDocument}` );
        if( lvOutsideClient )
            lvOutsideClient.lpush( loggingEvent.level.levelStr, tvDocument, () => {}   )
        else
            lvCache.push( {
                keys: loggingEvent.level.levelStr,
                document: tvDocument
            } )
    };
}

function configure( config, layouts ){
  let layout = layouts.basicLayout;

  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }

    return appender(config);
}

module.exports.configure = configure;

