import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {credentials} from '../server/google.mjs';
const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const original={client_email:'test@example.invalid',private_key:privateKey.export({type:'pkcs8',format:'pem'})};
const raw=JSON.stringify(original);
test('accepts JSON, dotenv pasted quotes, assignment and JSON-encoded JSON',()=>{
 for(const value of [raw,`'${raw}'`,`GOOGLE_SERVICE_ACCOUNT_JSON='${raw}'`,JSON.stringify(raw)]){
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON=value;
  assert.deepEqual(credentials(),original);
 }
});
test('normalizes escaped PEM newlines',()=>{
 process.env.GOOGLE_SERVICE_ACCOUNT_JSON=JSON.stringify({...original,private_key:original.private_key.replace(/\n/g,'\\n')});
 assert.equal(credentials().private_key,original.private_key);
});
test('configuration failures are actionable without echoing secret input',()=>{
 for(const value of ['secret-broken-json','null','{}',JSON.stringify({...original,private_key:'secret-invalid-key'})]){
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON=value;
  assert.throws(()=>credentials(),e=>e.status===503&&!e.message.includes('secret-'));
 }
 delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
 assert.throws(()=>credentials(),e=>e.status===503);
});
