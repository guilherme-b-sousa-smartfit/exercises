import test from 'node:test';import assert from 'node:assert/strict';
import {REVIEWERS,canAccessRow} from '../server/reviewers.mjs';
import {accessFor,sessionCookie,checkPassword} from '../server/auth.mjs';
import {saveReview} from '../server/review-store.mjs';
process.env.REVIEW_PASSWORD='test-admin-secret';
test('six contiguous balanced ranges cover every exercise once',()=>{let next=4;for(const p of REVIEWERS){assert.equal(p.startRow,next);assert([262,263].includes(p.endRow-p.startRow+1));next=p.endRow+1;}assert.equal(next,1578);});
test('signed reviewer sessions retain scope and reject tampering',()=>{for(const p of REVIEWERS){const cookie=sessionCookie(p);const req={headers:{cookie:`review_session=${cookie}`}};assert.equal(accessFor(req).id,p.id);assert(canAccessRow(accessFor(req),{rowNumber:p.startRow}));assert(!canAccessRow(accessFor(req),{rowNumber:p.startRow-1}));assert(!canAccessRow(accessFor(req),{rowNumber:p.endRow+1}));assert.equal(accessFor({headers:{cookie:`review_session=${cookie.replace(p.id,'admin')}`}}),null);}});
test('out of range patch rejected before any write or current data exposure',async()=>{let writes=0;await assert.rejects(saveReview({id:1,base:{comments:''},patch:{comments:'x'}},{read:async()=>({rows:[{id:1,rowNumber:267}],columns:{}}),write:async()=>{writes++;}},REVIEWERS[0]),e=>e.status===403&&!e.current);assert.equal(writes,0);});
test('admin keeps full access, unauthenticated access is denied',()=>{const req={headers:{host:'localhost:5198',origin:'http://localhost:5198'}};const admin=checkPassword(req,'test-admin-secret');assert.equal(admin.id,'admin');assert(canAccessRow(admin,{rowNumber:1577}));assert(!canAccessRow(null,{rowNumber:4}));});
