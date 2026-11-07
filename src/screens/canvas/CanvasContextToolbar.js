// /src/screens/canvas/CanvasContextToolbar.js
import {useBackDismiss} from '../../app/navigation/useBackNavigation';
import {CanvasTool,CanvasToolGroup} from './CanvasToolbar';
import CanvasSvgButton from './CanvasSvgButton';
import CanvasSwatches from './CanvasSwatches';
import CanvasSelectionOverlay from '../../canvas/CanvasSelectionOverlay';
export default function CanvasContextToolbar({object,edge,count,boxes,camera,viewport,bottom,appearance,onAppearance,onCloseAppearance,onEdit,onColor,onDuplicate,onMore,onGroup,onAlign,onFit,onLayout,onSource,sourceAvailable,onWidth,onArrange,onDelete,onStyle,groupDisabled=false,alignDisabled=false}){
 useBackDismiss(appearance,onCloseAppearance,30);
 if(!object&&!edge)return null;
 const diagram=object?.type==='diagram'||['wbs','taskDiagram'].includes(object?.sourceLink?.sourceType),extent=appearance?326:edge?162:266;
 const action=(label,icon,onPress,disabled=false)=><CanvasTool key={label} label={label} icon={icon} caption={false} onPress={onPress} disabled={disabled}/>;
 return <CanvasSelectionOverlay boxes={boxes} camera={camera} viewport={viewport} extent={extent} bottom={bottom}>
  <CanvasToolGroup style={{borderRadius:12,justifyContent:'center'}}>
   {appearance?<><CanvasSwatches value={object?.color||''} disabled={object?.locked} onChange={onColor}/>{action('Close color palette','x',onCloseAppearance)}</>:edge?<><CanvasSvgButton label="Style" kind="style" onPress={onStyle}/><CanvasSvgButton label="Fit" kind="fit" onPress={onFit}/><CanvasSvgButton label="Delete" kind="delete" onPress={onDelete}/></>:<>
    {count>1?<>{action('Group','layers',onGroup,groupDisabled)}{action('Align left','align-left',onAlign,alignDisabled)}</>:<>
     {object.type==='linked'?action('Open source','external-link',onSource,!sourceAvailable):object.type==='draw'?action('Stroke width','sliders',onWidth,object.locked):action(object.type==='frame'?'Rename frame':'Edit','edit-3',onEdit,object.locked)}
     {diagram?action('Diagram properties','git-branch',onLayout,object.locked):object.type==='frame'?action('Arrange','move',onArrange,object.locked):action('Color','droplet',onAppearance,object.locked)}
    </>}
    {action('Duplicate','copy',onDuplicate)}{action('Fit selection','maximize',onFit)}{action('Object properties','more-horizontal',onMore)}
   </>}
  </CanvasToolGroup>
 </CanvasSelectionOverlay>;
}
