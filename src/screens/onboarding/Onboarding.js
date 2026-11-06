// /src/screens/onboarding/Onboarding.js
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import BackSurface from '../../app/navigation/BackSurface';
import {useBackDismiss} from '../../app/navigation/useBackNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../ui/theme/theme';
import { Button, IconBtn, Input, ScreenIntro, T } from '../../ui/ui';
import PressSurface from '../../ui/PressSurface';
import Reveal from '../../ui/Reveal';
import TourArtwork from '../../components/illustrations/TourArtwork';
const { SLIDES, STARTERS, DEFAULT_STARTER, starterPlan, validName, stepBefore } = require('./onboardingPlan.cjs');

// First-run tour: three swipeable slides, a starter, a project name. Skip is on every step and leaves the sample project alone.
// The pager is a plain paging ScrollView and every motion is the app's own Reveal and PressSurface (opacity and transform only).
const Cta = ({ label, onPress, disabled }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 20 }}>
    <Button label={label} onPress={onPress} disabled={disabled} />
  </View>
);

export default function Onboarding({ onSkip, onFinish, children }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const w = Math.max(1,Math.min(screenWidth,520));
  const [step, setStep] = useState('tour');
  const [slide, setSlide] = useState(0);
  const [starter, setStarter] = useState(DEFAULT_STARTER);
  const [name, setName] = useState('');
  const pager = useRef(null),root=useRef(null),scrollTimer=useRef(null),pending=useRef(false),completed=useRef(false),back=useRef(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const plan = starterPlan(starter);
  const lastSlide = slide === SLIDES.length - 1;
  const goSlide = (i) => { setSlide(i); pager.current?.scrollTo({ x: i * w, animated: true }); };
  const submit=async()=>{
    if(pending.current||completed.current||!validName(name))return false;
    pending.current=true;setBusy(true);setError('');
    try{
      const result=await onFinish({name:name.trim(),starterId:starter});
      if(result===false||result===null){setError('The project was not created. Check the details and try again.');return false;}
      completed.current=true;return true;
    }catch(e){setError(e?.message||'The project could not be created. Try again.');return false;}
    finally{pending.current=false;setBusy(false);}
  };
  back.current=()=>{
    if(pending.current)return;
    if(step!=='tour')setStep(stepBefore(step));
    else if(slide>0)goSlide(slide-1);
    else onSkip();
  };
  useBackDismiss(true,()=>back.current(),30);
  const settle=e=>{const x=e.nativeEvent.contentOffset.x;if(Number.isFinite(x))setSlide(Math.max(0,Math.min(SLIDES.length-1,Math.round(x/w))));};
  useLayoutEffect(()=>{clearTimeout(scrollTimer.current);if(step==='tour')pager.current?.scrollTo({x:slide*w,animated:false});},[step,w]);
  useEffect(()=>()=>clearTimeout(scrollTimer.current),[]);
  useEffect(()=>{
    if(Platform.OS!=='web'){
      const sub=BackHandler.addEventListener('hardwareBackPress',()=>{back.current();return true;});return()=>sub.remove();
    }
    if(typeof document==='undefined')return;
    const previous=document.activeElement;
    const controls=()=>Array.from(root.current?.querySelectorAll?.('button,input,textarea,[tabindex="0"]')||[]).filter(el=>!el.disabled&&el.getAttribute('aria-disabled')!=='true'&&el.getClientRects().length);
    controls()[0]?.focus();
    const key=e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();back.current();}
      if(e.key==='Tab'){
        const items=controls(),first=items[0],last=items.at(-1);if(!first)return;
        if(!root.current?.contains(document.activeElement)||e.shiftKey&&document.activeElement===first||!e.shiftKey&&document.activeElement===last){e.preventDefault();(e.shiftKey?last:first).focus();}
      }
    };
    document.addEventListener('keydown',key,true);
    return()=>{document.removeEventListener('keydown',key,true);if(previous?.isConnected)previous.focus?.();};
  },[]);

  return (
    <View ref={root} accessibilityViewIsModal onAccessibilityEscape={()=>back.current()} {...(Platform.OS==='web'?{role:'dialog','aria-modal':true,'aria-label':'Milvayo first-run tour'}:{})} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, backgroundColor: c.bg, alignItems: 'center' }}>
      <BackSurface style={{flex:1,width:'100%',maxWidth:520}}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1,width:'100%',maxWidth:520}}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, minHeight: 60 }}>
          {step !== 'tour' ? <IconBtn icon="chevron-left" label="Back" onPress={()=>back.current()} /> : <View style={{ width: 44 }} />}
          <PressSurface accessibilityRole="button" accessibilityLabel="Skip the tour" disabled={busy} onPress={()=>{if(!pending.current)onSkip();}} hitSlop={4}
            style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center' }}>
            <T size={14} weight="600" muted>Skip</T>
          </PressSurface>
        </View>

        {step === 'tour' ? <>
          <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ flex: 1 }}
            onMomentumScrollEnd={settle} onScroll={e=>{if(Platform.OS==='web'){clearTimeout(scrollTimer.current);const x=e.nativeEvent.contentOffset.x;scrollTimer.current=setTimeout(()=>settle({nativeEvent:{contentOffset:{x}}}),180);}}} scrollEventThrottle={16}>
            {SLIDES.map((s) => (
              <ScrollView key={s.id} nestedScrollEnabled style={{width:w}} contentContainerStyle={{flexGrow:1,paddingHorizontal:28,paddingVertical:12,alignItems:'center',justifyContent:'center',gap:24}}>
                <TourArtwork kind={s.art} size={Math.max(0,Math.min(w - 56,300))} />
                <View style={{ gap: 8, alignItems: 'center' }}>
                  <T size={26} weight="600" center accessibilityRole="header">{s.title}</T>
                  <T size={14} muted center style={{ maxWidth: 320, lineHeight: 21 }}>{s.body}</T>
                </View>
              </ScrollView>
            ))}
          </ScrollView>
          <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`Slide ${slide + 1} of ${SLIDES.length}`} style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {SLIDES.map((s, i) => <View key={s.id} style={{ width: i === slide ? 22 : 6, height: 6, borderRadius: 3, backgroundColor: i === slide ? c.ink : c.line }} />)}
          </View>
          <Cta label={lastSlide ? 'Choose a starter' : 'Next'} onPress={() => (lastSlide ? setStep('start') : goSlide(slide + 1))} />
        </> : null}

        {step === 'start' ? <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }}>
            <Reveal><ScreenIntro title="What are you managing?" description="Pick a starting point. Switch tools on or off any time in More" /></Reveal>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {STARTERS.map((s, i) => {
                const on = s.id === starter;
                return (
                  <Reveal key={s.id} delay={60 + i * 40} style={{ width: Math.max(0,(w - 40 - 12) / 2) }}>
                    <PressSurface accessibilityRole="radio" accessibilityLabel={`${s.label}. ${s.hint}`} accessibilityState={{ checked: on }} onPress={() => setStarter(s.id)}
                      style={{ borderWidth: 1, borderColor: on ? c.ink : c.line, backgroundColor: on ? c.selection : c.surface, borderRadius: 18, padding: 12, gap: 6, alignItems: 'center' }}>
                      <TourArtwork kind={s.art} size={104} />
                      <T weight="600">{s.label}</T>
                      <T size={12} muted center style={{ lineHeight: 17 }}>{s.hint}</T>
                    </PressSurface>
                  </Reveal>
                );
              })}
            </View>
          </ScrollView>
          <Cta label="Continue" onPress={() => setStep('name')} />
        </> : null}

        {step === 'name' ? (
          <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
            <Reveal><ScreenIntro title="Name your project" description={`${plan.label} starter. ${plan.hint}`} /></Reveal>
            <Reveal delay={60}><Input value={name} onChangeText={setName} autoFocus placeholder="Project name" accessibilityLabel="Project name" onSubmitEditing={submit} /></Reveal>
            {error?<T accessibilityRole="alert" color={c.danger}>{error}</T>:null}
            <Cta label={busy?'Creating…':'Create project'} onPress={submit} disabled={busy||!validName(name)} />
          </ScrollView>
        ) : null}
      </View>
      </KeyboardAvoidingView></BackSurface>
      {children}
    </View>
  );
}
