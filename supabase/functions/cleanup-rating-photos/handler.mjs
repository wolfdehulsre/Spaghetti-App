/** @param {{ getSecret?: () => string | undefined, authorize?: (provided: string) => boolean | Promise<boolean>, createClient: () => any }} dependencies */
export function createCleanupHandler({getSecret,authorize,createClient}){
  return async request=>{
    if(request.method!=='POST')return new Response('Unauthorized',{status:401});
    try{
      const provided=request.headers.get('x-cleanup-secret');
      if(!provided||provided.length>256)return new Response('Unauthorized',{status:401});
      const secret=authorize ? undefined : getSecret?.();
      const allowed=authorize ? await authorize(provided) : !!secret&&provided===secret;
      if(!allowed)return new Response('Unauthorized',{status:401});
      const db=createClient();
      const batch=await db.rpc('photo_cleanup_batch');
      if(batch.error)return new Response('Could not prepare cleanup',{status:500});
      const paths=batch.data;
      if(paths.length){
        const removed=await db.storage.from('rating-photos').remove(paths);
        if(removed.error)return new Response('Storage cleanup will be retried',{status:500});
        const ack=await db.rpc('ack_photo_cleanup',{paths});
        if(ack.error)return new Response('Acknowledgement will be retried',{status:500});
      }
      return Response.json({removed:paths.length});
    }catch{return new Response('Cleanup will be retried',{status:500});}
  };
}
