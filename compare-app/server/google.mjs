import { createSign, createPrivateKey } from 'node:crypto';
let cached;
const configurationError=(message)=>Object.assign(new Error(message),{status:503});
export function credentials() {
 let raw=process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
 if(!raw) throw configurationError('Conexão com a planilha ainda não configurada.');
 // Accept a pasted dotenv assignment or its surrounding single quotes.
 if(raw.startsWith('GOOGLE_SERVICE_ACCOUNT_JSON='))raw=raw.slice('GOOGLE_SERVICE_ACCOUNT_JSON='.length).trim();
 if(raw.startsWith("'")&&raw.endsWith("'"))raw=raw.slice(1,-1);
 let value;
 try {
  value=JSON.parse(raw);
  if(typeof value==='string')value=JSON.parse(value);
 } catch {
  throw configurationError('GOOGLE_SERVICE_ACCOUNT_JSON está com JSON inválido na Vercel. Use o conteúdo completo do arquivo de credenciais e faça um novo deploy.');
 }
 if(!value||typeof value.client_email!=='string'||!value.client_email.trim()||typeof value.private_key!=='string') {
  throw configurationError('GOOGLE_SERVICE_ACCOUNT_JSON precisa conter client_email e private_key da conta de serviço.');
 }
 value.private_key=value.private_key.replace(/\\n/g,'\n');
 try {const key=createPrivateKey(value.private_key);if(key.asymmetricKeyType!=='rsa')throw new Error();}
 catch {throw configurationError('A private_key da credencial Google está inválida. Importe novamente o JSON original e faça um novo deploy.');}
 return value;
}
async function googleFetch(url,options) {
 try {return await fetch(url,options);}
 catch {throw Object.assign(new Error('Falha de conexão ou tempo limite ao acessar o Google. Tente novamente.'),{status:502});}
}
export async function googleToken() {
 if(cached && cached.expires>Date.now()+60000)return cached.token;
 const c=credentials(),now=Math.floor(Date.now()/1000);
 const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const unsigned=`${encode({alg:'RS256',typ:'JWT'})}.${encode({iss:c.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})}`;
 const assertion=`${unsigned}.${createSign('RSA-SHA256').update(unsigned).sign(c.private_key,'base64url')}`;
 const response=await googleFetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Object.assign(new Error('Não foi possível autenticar a conexão Google.'),{status:502});
 const body=await response.json();cached={token:body.access_token,expires:Date.now()+body.expires_in*1000};return cached.token;
}
export const SPREADSHEET_ID='1ALPqYEXQz7HKNGGcpHz554h82fYl-a-PJwmFemBUiSo';
export const SHEET_ID=663249658;
export async function sheets(path='',options={}) {
 const token=await googleToken();
 const response=await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${path}`,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});
 if(!response.ok) throw Object.assign(new Error(response.status===403?'A conexão Google não tem permissão para editar esta planilha.':'Não foi possível acessar a planilha. Tente novamente.'),{status:response.status===403?503:502});
 return response.json();
}
