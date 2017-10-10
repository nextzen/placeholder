'use strict';

let util = require('util');
let State = require('./State');

const byte = {
  empty:  null,
  low:    '\x00',
  high:   '\xFF',
  bound: {
    subject:  '',
    object:   '\x02',
    id:       '\x03'
  },
};

const fmt = {
  state:  [ byte.bound.subject, byte.bound.object, byte.bound.id ].join('%s')
};

const codec = {};

// id
codec.id = {
  encode: ( num ) => {
    let id = Buffer.alloc(4);
    id.writeInt32LE( num, 0 );
    return id;
  },
  decode: ( buf ) => {
    return buf.readInt32LE( 0 );
  }
};

// state
codec.state = {
  encode: ( state ) => {
    return Buffer.concat([
      Buffer.from( util.format( fmt.state, state.subject, state.object ) ),
      codec.id.encode( state.subjectId ),
      codec.id.encode( state.objectId )
    ]);
  },
  decode: ( buf ) => {

    // console.log( 'decode', buf );

    var endOfSubject = buf.indexOf( byte.bound.object );
    var endOfObject = buf.indexOf( byte.bound.id );

    var subjectBuffer = Buffer.alloc( endOfSubject );
    var objectBuffer = Buffer.alloc( endOfObject - endOfSubject - 1 );
    // var idBuffer = Buffer.alloc( buf.length - endOfObject - 1 );
    var subjectIdBuffer = Buffer.alloc( 4 );
    var objectIdBuffer = Buffer.alloc( 4 );

    buf.copy( subjectBuffer, 0, 0, endOfSubject );
    buf.copy( objectBuffer, 0, endOfSubject +1, endOfObject );
    buf.copy( subjectIdBuffer, 0, endOfObject +1, endOfObject +5 );
    buf.copy( objectIdBuffer, 0, endOfObject +5 );

    // console.log( subjectBuffer.toString('utf8') );
    // console.log( objectBuffer.toString('utf8') );
    // console.log( codec.id.decode( idBuffer ) );
    //
    // str.toString('utf8').split('').forEach((char, i) => {
    //   switch( step ){
    //     case 0:
    //       if( char === byte.bound.object ){ step = 1; return; }
    //       subject += char;
    //       return;
    //     case 1:
    //       if( char === byte.bound.id ){ step = 2; return; }
    //       object += char;
    //       return;
    //     case 2:
    //       idBytes += char;
    //   }
    // });
    //
    // console.log( 'idBytes', idBytes );

    return new State(
      codec.id.decode( subjectIdBuffer ),
      subjectBuffer.toString('utf8'),
      codec.id.decode( objectIdBuffer ),
      objectBuffer.toString('utf8')
    );

    // return new State( subject, object, codec.id.decode( idBytes ) );
  }
};

module.exports.byte = byte;
module.exports.fmt = fmt;
module.exports.codec = codec;

/**
 * @summary increment a buffer in little endian
 * @param buffer {Buffer} input buffer, will be modified
 * @description
 * Since 255 + 1 = 0 (mod 256), a "carry" is needed, if the
 * element is 255 before incrementing
 */
function incrementLE (buffer) {
    for (var i = 0; i < buffer.length; i++) {
        if (buffer[i]++ !== 255){ break; }
    }
}

/**
 * @summary increment a buffer in big endian
 */
function incrementBE (buffer) {
    for (var i = buffer.length - 1; i >= 0; i--) {
        if (buffer[i]++ !== 255){ break; }
    }
}

module.exports.incrementLE = incrementLE;
module.exports.incrementBE = incrementBE;
