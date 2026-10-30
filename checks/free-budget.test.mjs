import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateInput} from '../worker/itinerary.js';
import {researchRequest,transportResearchRequest} from '../worker/ai-draft.js';
test('no ceiling survives itinerary validation and model instructions do not interpret it as a free trip',()=>{
 const base={city:'Hanoi',country:'Vietnam',start:'2027-01-30',days:5,people:1,interests:'Hotel below 500000 per night',budget:0};
 for(const budget of [0,1234567]){
  const q=validateInput({...base,budget});assert.equal(q.budget,budget);
  assert.equal(q.hotelBudget.maxNightIDR,500000);
  for(const request of [researchRequest(q,{}),transportResearchRequest(q,{},'fixture research')]){
   assert.match(request.instructions,/budget of 0 means no maximum/);
   assert.match(request.instructions,/not that the trip must cost zero/);
   assert.match(request.instructions,/Unknown prices must remain unknown/);
  }
 }
});
