// The dedicated token stays in Vault; gateway JWT verification stays enabled.
import { createClient } from 'npm:@supabase/supabase-js@2.110.7';
import { createCleanupHandler } from './handler.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
Deno.serve(createCleanupHandler({
  authorize:async (provided: string)=>{
    const result=await db.rpc('photo_cleanup_authorized',{provided_secret:provided});
    if(result.error)throw Error('Could not verify cleanup authorization');
    return result.data===true;
  },
  createClient:()=>db
}));
