// Genting day tours are listed under their departure city. This changes only
// the editable Viator search scope, never the attraction's itinerary location.
export function activitySearchCity(city){
 return /^genting(?: highlands)?$/i.test(String(city||'').trim())?'Kuala Lumpur':city;
}
