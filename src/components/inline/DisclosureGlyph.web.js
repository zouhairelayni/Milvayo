// /src/components/inline/DisclosureGlyph.web.js
import {Feather} from '@expo/vector-icons';
export default function DisclosureGlyph({expanded,color}){return <Feather name={expanded?'x':'plus'} size={21} color={color}/>;}
