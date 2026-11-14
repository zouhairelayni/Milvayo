// /src/cloud/server/publicError.cjs
'use strict';
// Maps a thrown value to the HTTP response a caller may see. Coded and plain validation errors keep their message;
// programming errors, database driver errors and authentication library errors are replaced with a generic message.
const STATUS=Object.freeze({'permission-denied':403,unauthenticated:401,conflict:409,'already-exists':409,'invalid-argument':400,'failed-precondition':412});
function publicError(e){
 const code=e?.code,internal=!(e instanceof Error)||e instanceof TypeError||e instanceof RangeError||e instanceof ReferenceError||e instanceof SyntaxError||typeof code==='number'||(typeof code==='string'&&!STATUS[code]);
 if(typeof code==='string'&&code.startsWith('auth/'))return {status:401,body:{error:'Authentication failed',code:'unauthenticated'}};
 if(internal)return {status:500,body:{error:'The request could not be completed. Please try again.',code:'internal'}};
 return {status:STATUS[code]||400,body:{error:e.message,code:code||'invalid-argument'}};
}
module.exports={STATUS,publicError};
