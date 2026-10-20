export function createCleanupHandler({getSecret,createClient}){
  return async request=>{
    const secret=getSecret();
    if(request.method!=='POST'||!secret||request.headers.get('x-cleanup-secret')!==secret)
      return new Response('Unauthorized',{status:401});
    try{
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
