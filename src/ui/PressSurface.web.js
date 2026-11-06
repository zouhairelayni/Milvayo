// /src/ui/PressSurface.web.js
import {Pressable,View} from 'react-native';
export default function PressSurface({children,style,containerStyle,disabled,...props}){
 return <Pressable {...props} disabled={disabled} style={containerStyle}>{({pressed,hovered,focused})=><View style={[style,{opacity:disabled?.38:pressed?.82:1,transform:[{scale:pressed?.965:1}],transitionProperty:'transform, opacity',transitionDuration:'170ms',transitionTimingFunction:'cubic-bezier(.16,1,.3,1)',outline:focused?'2px solid currentColor':undefined,outlineOffset:3},hovered&&!disabled?{opacity:.86}:null]}>{children}</View>}</Pressable>;
}
