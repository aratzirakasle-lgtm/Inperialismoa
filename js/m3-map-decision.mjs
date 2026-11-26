// Map decisions model the principle in slide 18, not six real historical enclaves.
export function chooseMapPoint(state,index){
  if(!Number.isInteger(index)||index<0||index>=6||state.mapPoint===index)return false;
  state.mapPoint=index;state.map=null;state.mapConfirmed=false;state.mapFeedback=null;state.coast=true;state.interior=false;return true;
}
export function chooseMapAnswer(state,value){
  if(state.mapPoint===null||!['inside','europe','other'].includes(value))return false;
  if(state.map!==value){state.map=value;state.mapConfirmed=false;state.mapFeedback=null;state.interior=false;}
  return true;
}
export function confirmMapAnswer(state){
  if(state.mapPoint===null||!['inside','europe','other'].includes(state.map))return false;
  state.mapConfirmed=state.map==='inside';
  state.mapFeedback=state.mapConfirmed?'correct':'wrong';
  if(state.mapConfirmed){state.coast=true;state.interior=true;}
  return state.mapConfirmed;
}
export const mapDecisionComplete=state=>state.mapPoint!==null&&state.map==='inside'&&state.mapConfirmed===true;
export const mapArrowVisible=state=>mapDecisionComplete(state)&&state.coast&&state.interior;
