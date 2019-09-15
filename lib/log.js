const fs = require( 'fs' );
const log4js = require('log4js');

let logger = null;

/*
 * vOp
 *   collectionName
 * */
module.exports.getLogger = ( vOp ) => {
    if( logger  == null ){
        if( ( vOp == null )
         || ( vOp.host == null )
         || ( vOp.port == null ) ){
            throw new Error( 'Please point mongodb collection name at first require' );
        }

        if( vOp.dbIndex == null ) vOp.dbIndex = 0;
        if( vOp.level == null ) vOp.level = 'debug';

        log4js.configure( {
            appenders: {
                redisLog: {
                    type: './lib/redisAppender',
                    host: vOp.host,
                    port: vOp.port,
                    dbIndex: vOp.dbIndex,
                    connectionOptions: {
                        useNewUrlParser: true,
                        ssl: true,
                        sslValidate: true,
                        checkServerIdentity: false,
                    }

                },
            },
            categories: {
                default: { appenders: [
                    'redisLog',
                ], level: 'debug' }
            }
        } )

        logger = log4js.getLogger();
        logger.level = vOp.level;

        /*
         * vCode - must - refer err.js
         * vMessage - must - descripe your error message or advice
         * vStack - must - local stack
         * vCtx - option
         *  - thirdStack - third dependence stack(err)
         *
         * */
        logger.error_old = logger.error;
        logger.error = ( vCode, vMessage, vStack, vCtx ) => {
            if( ( vCode == null ) || ( vMessage == null ) || ( vStack == null ) )
                return;

            let tvLog = {
                Code: vCode,
                Message: vMessage,
                Stack: vStack,
            }

            if( vCtx ) tvLog.Ctx = vCtx;

            logger.error_old( tvLog );
        }

        logger.info_old = logger.info;
        logger.info = ( vCode, vCtx ) => {
            if( ( typeof vCode != 'string' )
             || ( typeof vCtx != 'object' ) ) return;

            vCtx.Code = vCode

            logger.info_old( vCtx );
        }

        module.exports = logger;
    }

    return logger;
}

