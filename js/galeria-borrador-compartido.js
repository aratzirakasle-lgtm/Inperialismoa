/* Lehen misioa · 1. ariketa · talde-borradorra.
   RPCs transaccionales con CAS: las claves correctas nunca llegan al navegador. */
let channelSerial=0;
export function createGallerySharedDraft(client,teamId){
  if(!client||!teamId)throw new Error('Taldearen datuak falta dira');
  const call=async(name,args)=>{
    const {data,error}=await client.rpc(name,args);
    if(error)throw error;
    if(!data||typeof data!=='object')throw new Error('Zerbitzariaren erantzun baliogabea');
    return data;
  };
  return {
    async load(){
      const [draft,official]=await Promise.all([
        client.from('gallery_team_drafts')
          .select('placements,revision,updated_at')
          .eq('team_id',teamId).maybeSingle(),
        client.from('gallery_team_state')
          .select('completed_at,locked_positions')
          .eq('team_id',teamId).maybeSingle()
      ]);
      if(draft.error)throw draft.error;
      if(official.error)throw official.error;
      return {
        exists:!!draft.data,
        placements:official.data?.completed_at
          ?(official.data.locked_positions||{}):(draft.data?.placements||{}),
        revision:Number(draft.data?.revision||0),
        completed:!!official.data?.completed_at
      };
    },
    move(id,zone,expected){
      return call('gallery_draft_move',{
        p_card_id:id,p_to_zone:zone,p_expected_zone:expected
      });
    },
    reset(revision){
      return call('gallery_draft_reset',{p_expected_revision:revision});
    },
    importLocal(placements){
      return call('gallery_draft_import',{p_placements:placements});
    },
    submit(revision){
      return call('submit_shared_gallery_attempt',{p_expected_revision:revision});
    },
    subscribe(notify){
      const channel=client.channel('gallery-team-draft-'+teamId+'-'+(++channelSerial))
        .on('postgres_changes',{
          event:'*',schema:'public',table:'gallery_team_drafts',
          filter:'team_id=eq.'+teamId
        },()=>notify())
        .subscribe();
      return ()=>{void client.removeChannel(channel)};
    }
  };
}
