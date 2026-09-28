import {supabase, setupMessage} from './supabase';
import type {Trip} from './travel-data';
export async function databaseTrips(expectedUserId: string, _url: string, options?: RequestInit): Promise<Response> {
  try {
    if (!supabase) throw Error(setupMessage);
    const {data: {user}, error: authError} = await supabase.auth.getUser();
    if (authError || !user || user.id !== expectedUserId) throw Error('Sesi berakhir. Silakan masuk kembali.');
    if (!options?.method || options.method === 'GET') {
      const {data, error} = await supabase.from('trips').select('id,data').eq('user_id', user.id).order('updated_at', {ascending: false});
      if (error) throw error;
      return Response.json({trips: data.map(row => ({...row.data, id: row.id}))});
    }
    if (options.method !== 'POST') throw Error('Metode tidak didukung.');
    const trip: Trip = JSON.parse(String(options.body));
    if (!trip || !Array.isArray(trip.items) || trip.items.length > 300 || !trip.start || !trip.destination) throw Error('Itinerary tidak valid.');
    const {id, ...data} = trip;
    const query = id
      ? supabase.from('trips').update({data}).eq('id', id).eq('user_id', user.id)
      : supabase.from('trips').insert({data, user_id: user.id});
    const {data: saved, error} = await query.select('id').single();
    if (error) throw error;
    return Response.json({id: saved.id});
  } catch (error) {
    return Response.json({error: error instanceof Error ? error.message : 'Database tidak dapat diakses. Periksa koneksi dan konfigurasi Supabase.'}, {status: 400});
  }
}
