const log = require( './lib/log' ).getLogger( {
    port: '6379',
    host: '127.0.0.1',
    dbIndex: 0
} );

log.debug( 'hello' )
log.debug( 1 )
log.debug( { hello: "mojies" } )
log.debug( { hello: "mojies", user: "windy" } )
log.debug( { hello: "mojies", user: "windy", sons: [ 1,2,3,4 ] } )
log.debug( { hello: "mojies", user: "windy", sons: [ 1,2,3,4 ] }, { hello: "mojies", user: "windy", sons: [ 1,2,3,4 ] } )

tvCount = 0;
tvReconnLoop = setInterval( () => {

    tvCount++;
    log.debug( tvCount )

}, 2000 )

