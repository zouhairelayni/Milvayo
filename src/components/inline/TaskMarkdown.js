// /src/components/inline/TaskMarkdown.js
import { View } from 'react-native';
import { T } from '../../ui/ui';
import { useTheme } from '../../ui/theme/theme';
import { lines } from '../../ui/taskMarkdown.cjs';
export default function TaskMarkdown({source}) {
  const { c }=useTheme();
  return <View style={{gap:4}}>{lines(source).map((line,i)=><T key={i} size={line.kind==='heading'?Math.max(15,20-line.level*2):14} weight={line.kind==='heading'?'700':'400'} color={line.kind==='quote'?c.muted:undefined} style={{lineHeight:22,minHeight:line.parts.length?undefined:9,marginTop:line.kind==='heading'&&i?6:0}}>
    {line.prefix}{line.parts.map((part,j)=><T key={j} size={line.kind==='heading'?Math.max(15,20-line.level*2):14} weight={part.bold?'700':undefined} style={{fontStyle:part.italic?'italic':'normal',textDecorationLine:part.strike?'line-through':'none',fontFamily:part.code?'monospace':undefined,backgroundColor:part.code?c.surfaceAlt:undefined}}>{part.text}</T>)}
  </T>)}</View>;
}
