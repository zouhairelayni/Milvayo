// /src/components/loading/ScreenSkeleton.js
import { Platform, View, useWindowDimensions } from 'react-native';
import { T } from '../../ui/uiBase';
import { useTheme } from '../../ui/theme/theme';
import SkeletonMotionSurface from './SkeletonMotionSurface';

export function SkeletonBlock({ width = '100%', height = 16, radius = 4, style }) {
  const { c } = useTheme();
  return <View style={[{ width, height, borderRadius: radius, backgroundColor: c.line }, style]}/>;
}
export const SkeletonLine = ({ width = '72%', ...props }) => <SkeletonBlock width={width} height={12} {...props}/>;
export const SkeletonPill = ({ width = 56 }) => <SkeletonBlock width={width} height={20} radius={8}/>;
const Row = ({ children, style }) => <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>{children}</View>;
export function SkeletonCard({ children, style }) {
  const { c } = useTheme();
  return <View style={[{ padding: 16, gap: 12, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }, style]}>{children}</View>;
}
function TaskRows({ count = 5 }) {
  return <View style={{ gap: 0 }}>{Array.from({ length: count }, (_, i) => <Row key={i} style={{ minHeight: 68 }}>
    <SkeletonBlock width={20} height={20}/><View style={{ flex: 1, gap: 8 }}><SkeletonLine width={i % 2 ? '60%' : '84%'}/><SkeletonLine width="40%" height={8}/></View><SkeletonPill/>
  </Row>)}</View>;
}
function BoardSkeleton({ wide }) {
  return <View style={{ gap: 16 }}><Row><SkeletonPill width={120}/><SkeletonPill width={80}/></Row>
    <View style={{ flexDirection: 'row', gap: 14 }}>{[0, 1, 2].map(column => <SkeletonCard key={column} style={{ width: wide ? 320 : 280, padding: 12 }}>
      <Row style={{ height: 44 }}><SkeletonBlock width={8} height={8}/><SkeletonLine width={136}/><SkeletonPill width={26}/></Row>
      {[0, 1, 2].map(card => <SkeletonCard key={card} style={{ padding: 18, gap: 18 }}><SkeletonLine width={card % 2 ? '65%' : '92%'}/><SkeletonLine width="60%"/><Row><SkeletonPill/><SkeletonPill width={40}/></Row></SkeletonCard>)}
    </SkeletonCard>)}</View></View>;
}
function TimelineSkeleton() {
  const { c } = useTheme();
  return <SkeletonCard style={{ padding: 0, overflow: 'hidden' }}>
    <Row style={{ height: 48, paddingHorizontal: 12 }}><SkeletonPill width={64}/><SkeletonLine width="48%"/></Row>
    <View style={{ minWidth: 600 }}>
      <Row style={{ height: 52, paddingHorizontal: 12 }}><SkeletonBlock width={112} height={20}/>{[0,1,2,3,4,5].map(n=><SkeletonLine key={n} width={64}/>)}</Row>
      {Array.from({length:6},(_,i)=><Row key={i} style={{height:54,paddingHorizontal:12}}><SkeletonLine width={112}/><View style={{flex:1,height:54,justifyContent:'center'}}>{[0,1,2,3,4,5,6].map(column=><View key={column} style={{position:'absolute',top:0,bottom:0,left:column*34,borderLeftWidth:1,borderColor:c.line}}/>)}<SkeletonBlock width={96+i%3*34} height={32} style={{marginLeft:24+i%3*34}}/></View></Row>)}
    </View>
  </SkeletonCard>;
}
function SprintsSkeleton({ wide }) {
  return <View style={{ gap: 20 }}><Row><SkeletonBlock width={44} height={44} radius={12}/><SkeletonPill width={100}/><SkeletonPill width={100}/></Row>
    <SkeletonCard><SkeletonLine width="65%" height={24}/><SkeletonLine width="52%"/><SkeletonLine width="90%"/><SkeletonBlock height={6}/><SkeletonLine width="45%"/></SkeletonCard>
    <SkeletonCard><SkeletonLine width={96} height={20}/><Row><SkeletonBlock width={80} height={48}/><SkeletonBlock width={80} height={48}/></Row><SkeletonBlock height={wide?240:200}/></SkeletonCard>
    <SkeletonCard><TaskRows count={3}/></SkeletonCard>
  </View>;
}
export default function ScreenSkeleton({ screen, active = true }) {
  const { width } = useWindowDimensions(), wide = width >= 900;
  const label = { board: 'Board', timeline: 'Timeline', tasks: 'Tasks', sprints: 'Sprints' }[screen] || 'workspace';
  return <View style={{ flex: 1, overflow: 'hidden' }} accessibilityState={{ busy: true }}>
    <T {...(Platform.OS === 'web' ? { role: 'status' } : { accessibilityLiveRegion: 'polite' })} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>Loading {label}</T>
    <SkeletonMotionSurface active={active} style={{ padding: 16, gap: 20 }}>
      {screen !== 'timeline' ? <View style={{ gap: 12 }}><SkeletonLine width={160} height={28}/><SkeletonLine width="68%"/></View> : null}
      {screen === 'board' ? <BoardSkeleton wide={wide}/> : screen === 'timeline' ? <TimelineSkeleton/> : screen === 'sprints' ? <SprintsSkeleton wide={wide}/> : <><Row><SkeletonPill width={80}/><SkeletonPill width={80}/><SkeletonPill width={80}/></Row><SkeletonCard><TaskRows/></SkeletonCard></>}
    </SkeletonMotionSurface>
  </View>;
}
