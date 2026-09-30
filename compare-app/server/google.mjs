import { createSign } from 'node:crypto';
let cached;
export function credentials() {
 const raw=process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
 if(!raw) throw Object.assign(new Error('Conexão com a planilha ainda não configurada.'),{status:503});
 const value=JSON.parse(raw);
 if(!value.client_email || !value.private_key) throw new Error('Credencial Google inválida.');
 return value;
}
export async function googleToken() {
 if(cached && cached.expires>Date.now()+60000)return cached.token;
 const c=credentials(),now=Math.floor(Date.now()/1000);
 const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const unsigned=`${encode({alg:'RS256',typ:'JWT'})}.${encode({iss:c.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})}`;
 const assertion=`${unsigned}.${createSign('RSA-SHA256').update(unsigned).sign(c.private_key,'base64url')}`;
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Object.assign(new Error('Não foi possível autenticar a conexão Google.'),{status:502});
 const body=await response.json();cached={token:body.access_token,expires:Date.now()+body.expires_in*1000};return cached.token;
}
export const SPREADSHEET_ID='1ALPqYEXQz7HKNGGcpHz554h82fYl-a-PJwmFemBUiSo';
export const SHEET_ID=663249658;
export async function sheets(path='',options={}) {
 const token=await googleToken();
 const response=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${path}`,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});
 if(!response.ok) throw Object.assign(new Error(response.status===403?'A conexão Google não tem permissão para editar esta planilha.':'Não foi possível acessar a planilha. Tente novamente.'),{status:response.status===403?503:502});
 return response.json();
}
