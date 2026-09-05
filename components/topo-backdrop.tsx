import { StyleSheet } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

/**
 * The crosshatch used behind the login screen and map surfaces
 * (design canvas: two repeating-linear-gradients at 58° and -32°).
 */
export function TopoBackdrop({ color = 'rgba(20,22,26,0.05)' }: { color?: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern
          id="topoA"
          width={34}
          height={34}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(58)"
        >
          <Line x1={0} y1={0} x2={0} y2={34} stroke={color} strokeWidth={1} />
        </Pattern>
        <Pattern
          id="topoB"
          width={42}
          height={42}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-32)"
        >
          <Line x1={0} y1={0} x2={0} y2={42} stroke={color} strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#topoA)" />
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#topoB)" />
    </Svg>
  );
}
